/**
 * One authenticated WebSocket for the whole app.
 *
 * Screens don't own sockets — they subscribe to event types here and are called
 * back when one arrives. The socket reconnects with backoff, and every screen
 * also refetches on focus, so a dropped connection degrades to slightly stale
 * data rather than to a broken screen.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { WS_URL } from '../config';
import { getAccessToken } from '../api/client';
import { useAuth } from './AuthContext';

export const WS_EVENTS = {
  NEW_JOB_REQUEST: 'new_job_request',
  CHAT_MESSAGE: 'chat_message',
  EXTRA_AMOUNT_DECISION: 'extra_amount_decision',
  PAYMENT_UPDATE: 'payment_update',
  JOB_UPDATE: 'job_update',
};

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const PING_INTERVAL_MS = 25000;

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { worker } = useAuth();
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const listenersRef = useRef(new Map()); // event type -> Set<handler>
  const reconnectRef = useRef({ attempt: 0, timer: null });
  const pingRef = useRef(null);
  // Set while signing out, so the close handler doesn't try to reconnect.
  const closingRef = useRef(false);

  // Handlers get the whole envelope, not the bare payload: a screen subscribed to
  // several types needs `event.type` to tell them apart, and one subscribed to a
  // single type still wants `event.payload.job_id` to check the event is about it.
  const emit = useCallback((type, payload) => {
    const event = { type, payload };
    const deliver = (handler) => {
      try {
        handler(event);
      } catch (error) {
        console.warn(`[ws] listener for ${type} threw`, error);
      }
    };
    listenersRef.current.get(type)?.forEach(deliver);
    listenersRef.current.get('*')?.forEach(deliver);
  }, []);

  const clearTimers = () => {
    if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
    reconnectRef.current.timer = null;
    if (pingRef.current) clearInterval(pingRef.current);
    pingRef.current = null;
  };

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token || closingRef.current) return;
    if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) return;

    // React Native's WebSocket cannot set headers, so the short-lived access
    // token travels as a query param. Never the refresh token.
    const socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onopen = () => {
      reconnectRef.current.attempt = 0;
      setConnected(true);
      pingRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send('ping');
      }, PING_INTERVAL_MS);
    };

    socket.onmessage = (event) => {
      if (event.data === 'pong') return;
      let frame;
      try {
        frame = JSON.parse(event.data);
      } catch {
        return;
      }
      if (frame?.type) emit(frame.type, frame.payload ?? {});
    };

    socket.onerror = () => {
      // `onclose` always follows, and that is where reconnection is handled.
    };

    socket.onclose = () => {
      setConnected(false);
      clearTimers();
      socketRef.current = null;
      if (closingRef.current || !getAccessToken()) return;

      const { attempt } = reconnectRef.current;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
      reconnectRef.current.attempt = attempt + 1;
      reconnectRef.current.timer = setTimeout(connect, delay);
    };
  }, [emit]);

  // Connect while signed in, tear down on sign-out.
  useEffect(() => {
    if (!worker) {
      closingRef.current = true;
      clearTimers();
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
      return undefined;
    }

    closingRef.current = false;
    reconnectRef.current.attempt = 0;
    connect();

    return () => {
      closingRef.current = true;
      clearTimers();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [worker, connect]);

  // Android silently kills sockets in the background; reconnect on resume.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && worker && !socketRef.current) connect();
    });
    return () => subscription.remove();
  }, [worker, connect]);

  /** Subscribe to one event type (or '*'). Returns the unsubscribe function. */
  const subscribe = useCallback((type, handler) => {
    const listeners = listenersRef.current;
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);

    return () => {
      const set = listeners.get(type);
      set?.delete(handler);
      if (set && set.size === 0) listeners.delete(type);
    };
  }, []);

  const value = useMemo(() => ({ connected, subscribe }), [connected, subscribe]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside SocketProvider');
  return context;
};

/**
 * Subscribe to one or more WS event types for the life of a component.
 *
 * The handler receives the `{type, payload}` envelope. It is held in a ref so an
 * inline arrow function doesn't re-subscribe on every render.
 */
export const useSocketEvent = (types, handler) => {
  const { subscribe } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const list = Array.isArray(types) ? types : [types];
  const key = list.join('|');

  useEffect(() => {
    const unsubscribes = key
      .split('|')
      .map((type) => subscribe(type, (event) => handlerRef.current(event)));
    return () => unsubscribes.forEach((fn) => fn());
  }, [key, subscribe]);
};
