# Task Name: Chat Widget Component Reorganization

## Description

Reorganized the chat widget package structure and fixed WebSocket connection stability issues. Improved connection handling to prevent unnecessary reconnections.

## Changes Made

1. **WebSocket Connection Stability**

   - Added connection persistence using refs
   - Prevented unnecessary reconnections
   - Stabilized event handlers
   - Improved cleanup logic

2. **Connection Management**

   - Connection established on widget open
   - Connection maintained during state updates
   - Proper cleanup on widget close
   - Better error handling

3. **Performance Improvements**

   - Reduced unnecessary re-renders
   - Stabilized callback handlers using refs
   - Optimized effect dependencies
   - Improved state management

4. **Component Structure**

```
packages/chat-widget/
├── src/
│   ├── components/
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── Header.test.tsx
│   │   │   └── styles.css
│   │   ├── PreviewMessages/
│   │   │   ├── PreviewMessages.tsx
│   │   │   ├── PreviewMessages.test.tsx
│   │   │   └── styles.css
│   │   ├── Message/
│   │   │   ├── Message.tsx
│   │   │   ├── Message.test.tsx
│   │   │   └── styles.css
│   │   ├── ToolMessage/
│   │   │   └── index.ts
│   │   └── MultimodalInput/
│   │       ├── MultimodalInput.tsx
│   │       ├── MultimodalInput.test.tsx
│   │       └── styles.css
│   ├── hooks/
│   │   └── useWebSocket.ts
│   ├── types/
│   │   └── index.ts
│   ├── ChatWidget.tsx
│   ├── ChatWidget.test.tsx
│   ├── styles.css
│   └── index.tsx
```

## Implementation Details

1. **WebSocket Hook Improvements**

```typescript
export const useWebSocket = ({
  url,
  sessionId,
  onMessage,
  onOpen,
  onClose,
  onError,
  enabled = true,
}: WebSocketHookOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef({ onMessage, onOpen, onClose, onError });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = { onMessage, onOpen, onClose, onError };
  }, [onMessage, onOpen, onClose, onError]);

  // WebSocket connection management
  useEffect(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    // ... event handlers using handlersRef

    return () => {
      if (enabled && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url, sessionId, enabled]);
};
```

2. **ChatWidget Improvements**

```typescript
export const ChatWidget: React.FC<ChatWidgetProps> = ({
  sessionId,
  wsUrl,
  ...props
}) => {
  // Use refs for stable callback handlers
  const handlersRef = useRef({
    onMessage: (data: WebSocketMessage) => {
      setMessages((prev) => [...prev, data]);
    },
    onOpen: () => setIsOnline(true),
    onClose: () => setIsOnline(false),
    onError: () => setIsOnline(false),
  });

  const { sendMessage } = useWebSocket({
    url: wsUrl,
    sessionId,
    onMessage: handlersRef.current.onMessage,
    onOpen: handlersRef.current.onOpen,
    onClose: handlersRef.current.onClose,
    onError: handlersRef.current.onError,
    enabled: isOpen,
  });
};
```

## Status: In Progress

## Next Steps

1. Test WebSocket connection stability
2. Verify message handling
3. Add reconnection logic
4. Implement tool message components

## Notes

- Fixed connection stability issues
- Improved performance with refs
- Better state management
- Proper cleanup handling

## Timestamp: 2024-03-19 12:00:00
