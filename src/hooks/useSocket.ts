// hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';

interface CampaignUpdate {
  campaignId: string;
  updates: {
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    progress: number;
    status: string;
    cost: number;
    updatedAt: string;
  };
}

interface CampaignDetailUpdate {
  campaign: any;
}

export function useSocket() {
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [campaignUpdates, setCampaignUpdates] = useState<CampaignUpdate[]>([]);

  useEffect(() => {
    if (!user || !token) return;

    // Initialize socket connection
    socketRef.current = io(import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('campaign-update', (data: CampaignUpdate) => {
      console.log('Received campaign update:', data);
      setCampaignUpdates(prev => [...prev, data]);
      
      // You can also trigger a callback or update global state here
    });

    socketRef.current.on('campaign-detail-update', (data: CampaignDetailUpdate) => {
      console.log('Received campaign detail update:', data);
      // Handle detailed campaign updates
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, token]);

  // Join a specific campaign room
//   const joinCampaignRoom = (campaignId: string) => {
//     if (socketRef.current && isConnected) {
//       socketRef.current.emit('join-campaign', campaignId);
//     }
//   };

  // Leave a campaign room
  const leaveCampaignRoom = (campaignId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-campaign', campaignId);
    }
  };

  return {
    isConnected,
    campaignUpdates,
    //joinCampaignRoom,
    leaveCampaignRoom,
    socket: socketRef.current
  };
}