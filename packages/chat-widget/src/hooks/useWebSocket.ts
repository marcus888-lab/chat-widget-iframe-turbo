import { useEffect, useCallback, useRef } from "react";
import {
  WebSocketMessage,
  WebSocketHookOptions,
  WebSocketHookResult,
} from "../types";

export const useWebSocket = ({
  url,
  sessionId,
  onMessage,
  onOpen,
  onClose,
  onError,
  enabled = true,
  reconnectAttempts = 3,
  reconnectInterval = 3000,
}: WebSocketHookOptions): WebSocketHookResult => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectCountRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);
  const isDisconnectingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const handlersRef = useRef({ onMessage, onOpen, onClose, onError });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = { onMessage, onOpen, onClose, onError };
  }, [onMessage, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    // Prevent multiple disconnects
    if (isDisconnectingRef.current) return;
    isDisconnectingRef.current = true;

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current !== undefined) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // Close connection if open
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "Normal closure");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      wsRef.current = null;
    }

    // Reset state
    reconnectCountRef.current = 0;
    isConnectingRef.current = false;
    isDisconnectingRef.current = false;
  }, []);

  const connect = useCallback(() => {
    // Don't connect if disabled, unmounted, or already connecting/connected
    if (
      !isMountedRef.current ||
      !enabled ||
      isConnectingRef.current ||
      isDisconnectingRef.current ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    isConnectingRef.current = true;

    // Clean up existing connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (error) {
        console.error("Error closing existing WebSocket:", error);
      }
      wsRef.current = null;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current !== undefined) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    try {
      // Append session_id as query parameter
      const wsUrl = new URL(url);
      wsUrl.searchParams.append("session_id", sessionId);

      const ws = new WebSocket(wsUrl.toString());

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        console.log("WebSocket connected");
        reconnectCountRef.current = 0;
        isConnectingRef.current = false;
        handlersRef.current.onOpen?.();
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          handlersRef.current.onMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
          handlersRef.current.onError?.(error as Error);
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        console.log("WebSocket disconnected", event.code, event.reason);
        wsRef.current = null;
        isConnectingRef.current = false;

        // Only attempt reconnect if not intentionally disconnected and component is mounted
        if (
          !isDisconnectingRef.current &&
          isMountedRef.current &&
          enabled &&
          event.code !== 1000
        ) {
          if (reconnectCountRef.current < reconnectAttempts) {
            console.log(
              `Reconnecting... Attempt ${reconnectCountRef.current + 1}`
            );
            const backoffTime =
              reconnectInterval *
              Math.min(Math.pow(2, reconnectCountRef.current), 10);
            reconnectTimeoutRef.current = window.setTimeout(() => {
              if (!isMountedRef.current) return;
              reconnectCountRef.current += 1;
              connect();
            }, backoffTime);
          } else {
            console.log("Max reconnection attempts reached");
          }
        }

        handlersRef.current.onClose?.();
      };

      ws.onerror = (error) => {
        if (!isMountedRef.current) return;
        console.error("WebSocket error:", error);
        handlersRef.current.onError?.(error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      isConnectingRef.current = false;
      if (isMountedRef.current) {
        handlersRef.current.onError?.(error as Error);
      }
    }
  }, [url, sessionId, enabled, reconnectAttempts, reconnectInterval]);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle connection
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]); // Remove url and sessionId from dependencies

  const sendMessage = useCallback(
    (message: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ message }));
      } else {
        console.error("WebSocket is not connected");
        if (enabled && reconnectCountRef.current < reconnectAttempts) {
          connect();
        }
      }
    },
    [connect, enabled, reconnectAttempts]
  );

  return { sendMessage, connect, disconnect };
};

export default useWebSocket;
