// hooks/useChat.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useChat = (apiBase: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const stompClient = useRef<Client | null>(null);
  const subscriptions = useRef<Record<string, any>>({});

  const connect = useCallback((token: string) => {
    const socket = new SockJS(`${apiBase}/ws/chat`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
    });
    client.activate();
    stompClient.current = client;
  }, [apiBase]);

  const subscribeToRoom = (roomId: string) => {
    if (!stompClient.current?.connected) return;
    
    // 기존 구독 해제
    Object.values(subscriptions.current).forEach(sub => sub.unsubscribe());
    
    const sub = stompClient.current.subscribe(`/topic/chat.room.${roomId}`, (msg) => {
      const received = JSON.parse(msg.body);
      setMessages(prev => [...prev, received]);
    });
    subscriptions.current[roomId] = sub;
  };

  const sendMessage = (roomId: string, content: string, roomType: string) => {
    if (!stompClient.current?.connected) return;
    stompClient.current.publish({
      destination: `/app/chat.send/${roomId}`,
      body: JSON.stringify({ content, roomType }),
    });
  };

  return { isConnected, messages, setMessages, connect, subscribeToRoom, sendMessage, isLoadingMore, setIsLoadingMore, hasMore, setHasMore };
};