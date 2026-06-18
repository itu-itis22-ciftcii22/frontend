import { useEffect, useState, useRef } from 'react';
import { useAuth } from './auth';
import { API_BASE_URL } from './api/client';
import { useIsFocused } from '@react-navigation/native';

export interface WebSocketIndicatorEvent {
  asset: string;
  indicator_id: number;
  type: string;
  output: Record<string, number>;
  timestamp: string;
  interval: string;
  _msg_id: string;
  _stream: string;
}

export interface WebSocketStrategySignal {
  strategy_id: number;
  asset: string;
  signal: "ENTRY" | "EXIT";
  interval: string;
  _msg_id: string;
  _stream: string;
}

const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export function useLiveFeed(asset: string) {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [signals, setSignals] = useState<WebSocketStrategySignal[]>([]);
  const [latestIndicator, setLatestIndicator] = useState<WebSocketIndicatorEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectDelayRef = useRef<number>(1000);

  useEffect(() => {
    const currentToken = token;
    const currentAsset = asset;

    // Reset state for new asset, token, or focus session to prevent data leaks
    setSignals([]);
    setLatestIndicator(null);
    lastEventIdRef.current = null;

    if (!currentToken || !currentAsset || !isFocused) {
      setConnectionStatus('disconnected');
      return;
    }

    let isMounted = true;

    function connect() {
      if (wsRef.current) {
        wsRef.current.close();
      }

      setConnectionStatus('connecting');

      const lastEventIdQuery = lastEventIdRef.current ? `&last_event_id=${encodeURIComponent(lastEventIdRef.current)}` : '';
      const wsUrl = `${WS_BASE_URL}/ws/live/${encodeURIComponent(currentAsset)}?token=${encodeURIComponent(currentToken as string)}${lastEventIdQuery}`;

      console.log(`Connecting to WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        reconnectDelayRef.current = 1000; // Reset reconnect delay
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);

          if (data._msg_id) {
            lastEventIdRef.current = data._msg_id;
          }

          if ('signal' in data) {
            const signalEvent = data as WebSocketStrategySignal;
            setSignals((prev) => [...prev, signalEvent]);
          } else if ('indicator_id' in data) {
            const indicatorEvent = data as WebSocketIndicatorEvent;
            setLatestIndicator(indicatorEvent);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus('disconnected');
        
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, 30000); // Max 30s
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            connect();
          }
        }, delay);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [asset, token, isFocused]);

  const clearSignals = () => {
    setSignals([]);
  };

  return {
    signals,
    latestIndicator,
    connectionStatus,
    clearSignals,
  };
}
