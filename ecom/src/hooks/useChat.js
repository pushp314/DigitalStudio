import { useState, useEffect, useRef, useCallback } from 'react';
import api, { WS_URL } from '../services/api';

/**
 * Custom hook for managing real-time chat with auto-reconnection and state cleanup.
 */
export const useChat = (user) => {
    const [messages, setMessages] = useState([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [status, setStatus] = useState('connecting'); // connecting, online, offline, error
    const [historyLoading, setHistoryLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState({}); // { userId: { name, timestamp } }
    
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectCountRef = useRef(0);
    const MAX_RECONNECT_DELAY = 30000;

    const fetchHistory = useCallback(async () => {
        try {
            setHistoryLoading(true);
            const data = await api.get('/chat/history');
            setMessages(Array.isArray(data) ? data.map(m => ({ ...m, status: 'read' })) : []);
        } catch (err) {
            console.error('Failed to load chat history', err);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        const token = localStorage.getItem('token');
        if (!token) {
            setStatus('error');
            return;
        }

        const url = `${WS_URL}/chat/ws?token=${token}`;
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('Chat Link Verified');
            setStatus('online');
            reconnectCountRef.current = 0;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };

        ws.onmessage = (event) => {
            try {
                const lines = event.data.split('\n');
                lines.forEach(line => {
                    if (!line.trim()) return;
                    
                    let data;
                    try {
                        data = JSON.parse(line);
                    } catch (e) {
                        // Handle raw string fallbacks from legacy broadcasts
                        data = { content: line, type: 'text', createdAt: new Date().toISOString() };
                    }
                    
                    processMessage(data);
                });
            } catch (err) {
                console.error("Critical Stream Error:", err);
            }
        };

        ws.onclose = () => {
            console.log('Chat Link Interrupted');
            setStatus('offline');
            
            // Indefinite Reconnection
            const delay = Math.min(1000 * Math.pow(1.5, reconnectCountRef.current), MAX_RECONNECT_DELAY);
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectCountRef.current++;
                connect();
            }, delay);
        };

        ws.onerror = () => setStatus('error');

        socketRef.current = ws;
    }, []);

    const processMessage = (data) => {
        if (data.type === 'presence') {
            setOnlineCount(data.count);
        } else if (data.type === 'typing') {
            if (data.userId === user?.id) return;
            setTypingUsers(prev => ({
                ...prev,
                [data.userId]: { name: data.userName, timestamp: Date.now() }
            }));
        } else if (data.type === 'read') {
            if (data.userId === user?.id) return;
            setMessages(prev => prev.map(m => 
                m.userId === user?.id && m.status !== 'read' ? { ...m, status: 'read' } : m
            ));
        } else {
            setMessages(prev => {
                const existingIndex = prev.findIndex(m => (data.cid && m.cid === data.cid) || (data.id && m.id === data.id));
                
                // Determine initial status based on presence
                const status = (onlineCount > 1) ? 'read' : 'delivered';

                if (existingIndex !== -1) {
                    const next = [...prev];
                    next[existingIndex] = { ...data, status };
                    return next;
                }
                return [...prev, { ...data, status: 'sent' }];
            });
        }
    };

    const markAllAsRead = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(`@read:`);
        }
    }, []);

    // Mark as read on mount and on visibility change
    useEffect(() => {
        if (status === 'online') {
            markAllAsRead();
        }
    }, [status, markAllAsRead]);

    // Cleanup stale typing indicators
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

    const sendMessage = useCallback(async (content) => {
        if (content.startsWith('@')) {
            console.warn('System command detected in message stream. Blocking normal persistence.');
            return false;
        }

        const cid = `cid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticMsg = {
            cid,
            userId: user.id,
            userName: user.name,
            content,
            isPro: user.subscriptionPlan === 'pro',
            type: content.startsWith('```') ? 'code' : 'text',
            createdAt: new Date().toISOString(),
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            // Using HTTP POST for high reliability sending
            const data = await api.post('/chat/messages', { cid, content });
            
            // Mark as sent immediately on success
            setMessages(prev => prev.map(m => 
                m.cid === cid ? { ...m, id: data.id, status: 'sent' } : m
            ));
            return true;
        } catch (err) {
            console.error("Failed to send message via REST:", err);
            setMessages(prev => prev.map(m => m.cid === cid ? { ...m, status: 'error' } : m));
            return false;
        }
    }, [user]);

    const sendTyping = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(`@typing:`);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchHistory();
            connect();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [user, fetchHistory, connect]);

    return {
        messages,
        onlineCount,
        status,
        historyLoading,
        typingUsers,
        sendMessage,
        sendTyping,
        retryConnection: connect
    };
};
