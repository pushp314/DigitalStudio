import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useRealtime } from '../context/RealtimeContext';

/**
 * Custom hook for managing real-time chat utilizing a global realtime context.
 */
export const useChat = (user) => {
    const { status, onlineCount, onlineUsers, events, sendSignal } = useRealtime();
    
    const [messages, setMessages] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState({});
    
    // 1. Initial Load
    const fetchHistory = useCallback(async () => {
        if (!user) return;
        try {
            setHistoryLoading(true);
            const data = await api.get('/chat/history');
            setMessages(Array.isArray(data) ? data.map(m => ({ ...m, status: 'read' })) : []);
        } catch (err) {
            console.error('Failed to load chat history', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [user]);

    // 2. Process Incoming Events from the Global Hub
    useEffect(() => {
        if (!events) return;
        const { type, data } = events;

        if (type === 'typing') {
            if (data.userId === user?.id) return;
            setTypingUsers(prev => ({
                ...prev,
                [data.userId]: { name: data.userName, timestamp: Date.now() }
            }));
        } else if (type === 'read') {
            if (data.userId === user?.id) return;
            setMessages(prev => prev.map(m => 
                m.userId === user?.id && m.status !== 'read' ? { ...m, status: 'read' } : m
            ));
        } else if (type === 'delete') {
            setMessages(prev => prev.filter(m => m.id !== data.id));
        } else if (type === 'edit') {
            setMessages(prev => prev.map(m => 
                m.id === data.id ? { ...m, content: data.content, isEdited: true } : m
            ));
        } else if (type === 'bulk_delete') {
            const deleteIds = data.ids || [];
            setMessages(prev => prev.filter(m => !deleteIds.includes(m.id)));
        } else if (type === 'metadata_update') {
            setMessages(prev => prev.map(m => 
                m.id === data.id ? { ...m, ...data } : m
            ));
        } else {
            // Normal message
            if (data.userId) {
                setTypingUsers(prev => {
                    if (!prev[data.userId]) return prev;
                    const next = { ...prev };
                    delete next[data.userId];
                    return next;
                });
            }
            setMessages(prev => {
                const existingIndex = prev.findIndex(m => (data.cid && m.cid === data.cid) || (data.id && m.id === data.id));
                const deliveryStatus = (onlineCount > 1) ? 'read' : 'delivered';

                if (existingIndex !== -1) {
                    const next = [...prev];
                    next[existingIndex] = { 
                        ...prev[existingIndex], 
                        ...data, 
                        status: data.status || deliveryStatus 
                    };
                    return next;
                }
                return [...prev, { ...data, status: 'sent' }];
            });
        }
    }, [events, user, onlineCount]);

    const sendMessage = useCallback(async (payload) => {
        const content = typeof payload === 'string' ? payload : payload.content;
        const attachmentUrl = payload.attachmentUrl || null;
        const isImage = payload.isImage || false;

        if (!content && !isImage) return false;

        const cid = `cid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticMsg = {
            cid,
            userId: user.id,
            userName: user.name,
            content: content || "",
            attachmentUrl: attachmentUrl,
            isImage: isImage,
            isPro: user.subscriptionPlan === 'pro' || user.role === 'admin' || user.isPro,
            type: isImage ? 'image' : (content?.startsWith('```') ? 'code' : 'text'),
            parentId: payload.parentId,
            replyToName: payload.replyToName,
            replyToContent: payload.replyToContent,
            createdAt: new Date().toISOString(),
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const data = await api.post('/chat/messages', { 
                cid, 
                content: content || "",
                attachmentUrl: attachmentUrl,
                isImage: isImage,
                parentId: payload.parentId,
                replyToName: payload.replyToName,
                replyToContent: payload.replyToContent
            });
            setMessages(prev => prev.map(m => 
                m.cid === cid ? { ...m, id: data.id, status: 'sent', isPro: data.isPro } : m
            ));
            return true;
        } catch (err) {
            setMessages(prev => prev.map(m => m.cid === cid ? { ...m, status: 'error' } : m));
            return false;
        }
    }, [user]);

    const deleteMessage = useCallback(async (msgId) => {
        try {
            await api.delete(`/chat/messages/${msgId}`);
            setMessages(prev => prev.filter(m => m.id !== msgId));
            return true;
        } catch (err) {
            console.error("Failed to delete message", err);
            return false;
        }
    }, []);

    const editMessage = useCallback(async (msgId, newContent) => {
        if (user?.subscriptionPlan !== 'pro' && user?.role !== 'admin') {
            return false;
        }
        try {
            await api.put(`/chat/messages/${msgId}`, { content: newContent });
            setMessages(prev => prev.map(m => 
                m.id === msgId ? { ...m, content: newContent, isEdited: true } : m
            ));
            return true;
        } catch (err) {
            console.error("Failed to edit message", err);
            return false;
        }
    }, [user]);

    const sendTyping = useCallback(() => {
        sendSignal(`@typing:`);
    }, [sendSignal]);

    const markAllAsRead = useCallback(() => {
        sendSignal(`@read:`);
    }, [sendSignal]);

    useEffect(() => {
        if (user) fetchHistory();
    }, [user, fetchHistory]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTypingUsers(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(id => {
                    if (now - next[id].timestamp > 3000) {
                        delete next[id];
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleFocus = () => fetchHistory();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchHistory]);

    useEffect(() => {
        if (status === 'online') fetchHistory();
    }, [status, fetchHistory]);

    return {
        messages,
        onlineCount,
        onlineUsers,
        status,
        historyLoading,
        typingUsers,
        sendMessage,
        deleteMessage,
        editMessage,
        sendTyping,
        markAllAsRead,
        retryConnection: () => {} 
    };
};
