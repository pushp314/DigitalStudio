import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AuthContext from './AuthContext';
import { API_URL, WS_URL } from '../services/api';

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [status, setStatus] = useState('connecting');
    const [onlineCount, setOnlineCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [events, setEvents] = useState(null); // { type, data }
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectCountRef = useRef(0);
    const isClosingRef = useRef(false);
    const statusRef = useRef('connecting');

    const updateStatus = (newStatus) => {
        statusRef.current = newStatus;
        setStatus(newStatus);
    };

    const connect = useCallback(async () => {
        if (!user || socketRef.current?.readyState === WebSocket.OPEN) return;
        if (statusRef.current === 'authenticating' || statusRef.current === 'connecting') return;

        const token = localStorage.getItem('token');
        if (!token) return;

        isClosingRef.current = false;
        updateStatus('authenticating');

        try {
            // 1. Exchange Session for a One-Time Ticket (Secure 10/10 Architecture)
            const response = await fetch(`${API_URL}/chat/ticket`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.error('Handshake Throttled: Too many requests');
                    updateStatus('error');
                    return;
                }
                console.error('Handshake Failure: Identity ticket could not be issued');
                updateStatus('error');
                return;
            }

            const { ticket } = await response.json();
            updateStatus('connecting');

            // 2. Upgraded handshake (no JWT in URL)
            const ws = new WebSocket(`${WS_URL}/chat/ws?ticket=${ticket}`);

            ws.onopen = () => {
                console.log('Real-time connection synchronized');
                updateStatus('online');
                reconnectCountRef.current = 0;
            };

            ws.onmessage = (event) => {
                const raw = event.data.split('\n');
                raw.forEach(line => {
                    if (!line.trim()) return;
                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'presence') {
                            setOnlineCount(data.count);
                            setOnlineUsers(data.users || []);
                        }
                        setEvents({ type: data.type, data, timestamp: Date.now() });
                    } catch (e) {
                        setEvents({ type: 'text', data: { content: line }, timestamp: Date.now() });
                    }
                });
            };

            ws.onclose = () => {
                if (isClosingRef.current) return;
                
                updateStatus('offline');
                const delay = Math.min(1000 * Math.pow(1.5, reconnectCountRef.current), 30000);
                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectCountRef.current++;
                    connect();
                }, delay);
            };

            socketRef.current = ws;
        } catch (err) {
            console.error('Real-time connection error:', err);
            updateStatus('error');
        }
    }, [user]);

    useEffect(() => {
        connect();
        return () => {
            isClosingRef.current = true;
            if (socketRef.current) socketRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    const sendSignal = (msg) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(msg);
        }
    };

    return (
        <RealtimeContext.Provider value={{ status, onlineCount, onlineUsers, events, sendSignal }}>
            {children}
        </RealtimeContext.Provider>
    );
};

export const useRealtime = () => useContext(RealtimeContext);
export default RealtimeContext;
