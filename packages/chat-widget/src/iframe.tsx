import React from "react";
import { createRoot } from "react-dom/client";
import { ChatWidget as ChatWidgetComponent } from "./index";

// Define the initialization options type
interface ChatWidgetOptions {
  sessionId: string;
  wsUrl: string;
  title?: string;
  placeholder?: string;
}

// Create the initialization function
function init(options: ChatWidgetOptions) {
  const container = document.createElement("div");
  container.id = "chat-widget-root";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ChatWidgetComponent
        sessionId={options.sessionId}
        wsUrl={options.wsUrl}
        title={options.title || "AI Assistant"}
        placeholder={options.placeholder || "Ask me anything..."}
      />
    </React.StrictMode>
  );
}

// Create the widget controller object
const ChatWidgetController = { init };

// Make it available globally
(window as any).ChatWidget = ChatWidgetController;

// Export for TypeScript support
export type { ChatWidgetOptions };
export { ChatWidgetController };
