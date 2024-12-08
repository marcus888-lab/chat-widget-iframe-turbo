import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatWidget } from './ChatWidget';
import type { ChatWidgetProps } from './types';

// Function to inject and initialize the chat widget
export const initChatWidget = (config: ChatWidgetProps): void => {
  // Create container for widget
  const container = document.createElement('div');
  container.id = 'chat-widget-root';
  document.body.appendChild(container);

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0';
  iframe.style.right = '0';
  iframe.style.width = '380px';
  iframe.style.height = '580px';
  iframe.style.border = 'none';
  iframe.style.backgroundColor = 'transparent';
  iframe.style.zIndex = '999999';
  document.body.appendChild(iframe);

  // Initialize widget content inside iframe
  if (iframe.contentWindow) {
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Chat Widget</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: transparent;
              font-family: system-ui, -apple-system, sans-serif;
            }
            #chat-widget-root {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div id="chat-widget-root"></div>
        </body>
      </html>
    `);
    doc.close();

    // Create widget root in iframe
    const iframeContainer = doc.getElementById('chat-widget-root');
    if (iframeContainer) {
      const root = createRoot(iframeContainer);
      root.render(<ChatWidget {...config} />);
    }
  }
};

// Export the ChatWidget component for direct use
export { ChatWidget } from './ChatWidget';
export type { ChatWidgetProps } from './types';

// Add global initialization function
if (typeof window !== 'undefined') {
  window.ChatWidget = {
    init: initChatWidget,
  };
}
