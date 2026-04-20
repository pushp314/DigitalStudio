import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AuthContext from './AuthContext';
import { WS_URL } from '../services/api';

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

    const connect = useCallback(() => {
        if (!user || socketRef.current?.readyState === WebSocket.OPEN) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const ws = new WebSocket(`${WS_URL}/chat/ws?token=${token}`);

        ws.onopen = () => {
            console.log('Real-time Uplink Synchronized');
            setStatus('online');
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
            setStatus('offline');
            const delay = Math.min(1000 * Math.pow(1.5, reconnectCountRef.current), 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectCountRef.current++;
                connect();
            }, delay);
        };

        socketRef.current = ws;
    }, [user]);

    useEffect(() => {
        connect();
        return () => {
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
