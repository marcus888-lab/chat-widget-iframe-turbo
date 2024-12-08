# Chat Widget

A customizable chat widget component that can be embedded in any webpage using an iframe. Supports various types of tool-based responses with specialized layouts.

## Features

- 🎯 Specialized tool message components
- 🖼️ iframe-based embedding
- 💅 Modular styling
- 🔄 Real-time WebSocket communication
- 📱 Responsive design
- 🛠️ Extensible tool system

## Installation

```bash
pnpm add @repo/chat-widget
```

## Usage

### Basic Usage

```typescript
import { ChatWidget } from '@repo/chat-widget';

function App() {
  return (
    <ChatWidget
      sessionId="unique-session-id"
      wsUrl="wss://your-backend/chat"
      title="AI Assistant"
      placeholder="Ask me anything..."
    />
  );
}
```

### Embedding in Any Webpage

```html
<script>
  window.ChatWidget.init({
    sessionId: 'unique-session-id',
    wsUrl: 'wss://your-backend/chat',
    title: 'AI Assistant',
    placeholder: 'Ask me anything...'
  });
</script>
```

## Tool Message Types

### 1. Code Block
```typescript
// Example response with code
{
  type: 'message',
  role: 'assistant',
  message: 'Here is the code:',
  toolResults: [{
    tool: 'code',
    result: {
      code: 'console.log("Hello")',
      language: 'javascript'
    }
  }]
}
```

### 2. Search Results
```typescript
// Example response with search results
{
  type: 'message',
  role: 'assistant',
  message: 'Here are the results:',
  toolResults: [{
    tool: 'search',
    result: {
      query: 'React hooks',
      results: [
        {
          title: 'Introduction to React Hooks',
          description: 'Learn about React Hooks...',
          url: 'https://example.com/hooks'
        }
      ]
    }
  }]
}
```

### 3. Data Tables
```typescript
// Example response with table data
{
  type: 'message',
  role: 'assistant',
  message: 'Here is the data:',
  toolResults: [{
    tool: 'table',
    result: {
      caption: 'User Statistics',
      columns: [
        { key: 'name', title: 'Name' },
        { key: 'role', title: 'Role' }
      ],
      rows: [
        { name: 'John', role: 'Admin' },
        { name: 'Jane', role: 'User' }
      ]
    }
  }]
}
```

## Styling

The widget comes with default styles but can be customized using CSS variables:

```css
:root {
  --chat-widget-primary: #0070f3;
  --chat-widget-bg: #ffffff;
  --chat-widget-text: #1a1a1a;
  --chat-widget-border: #e9ecef;
}
```

## Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build package
pnpm build

# Run type check
pnpm typecheck
```

## Adding New Tool Types

1. Create a new component in `src/components/tool-messages/`
2. Add the component to `index.ts`
3. Update the `ToolType` type
4. Add styling in `styles.css`

Example:

```typescript
// ChartView.tsx
interface ChartViewProps {
  data: number[];
  labels: string[];
  type: 'bar' | 'line';
}

export const ChartView: React.FC<ChartViewProps> = ({ data, labels, type }) => {
  // Implementation
};

// Update index.ts
export type ToolType = 'code' | 'search' | 'table' | 'chart';
export { ChartView } from './ChartView';
```

## License

MIT
