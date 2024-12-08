'use client';

import React from 'react';
import { ChatWidget } from '@repo/chat-widget';

export default function ChatTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Chat Widget Test</h1>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Example Messages</h2>

          {/* Mock messages for testing different tool types */}
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-gray-50 rounded">
              <pre className="text-sm">
                {JSON.stringify({
                  type: 'message',
                  role: 'assistant',
                  message: 'Here is a code example:',
                  toolResults: [{
                    tool: 'code',
                    result: {
                      code: 'console.log("Hello World")',
                      language: 'javascript'
                    }
                  }]
                }, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <pre className="text-sm">
                {JSON.stringify({
                  type: 'message',
                  role: 'assistant',
                  message: 'Here are the search results:',
                  toolResults: [{
                    tool: 'search',
                    result: {
                      query: 'React hooks',
                      results: [
                        {
                          title: 'Understanding React Hooks',
                          description: 'A comprehensive guide to React Hooks...',
                          url: 'https://example.com/hooks'
                        }
                      ]
                    }
                  }]
                }, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <pre className="text-sm">
                {JSON.stringify({
                  type: 'message',
                  role: 'assistant',
                  message: 'Here is the data in a table:',
                  toolResults: [{
                    tool: 'table',
                    result: {
                      caption: 'User Data',
                      columns: [
                        { key: 'name', title: 'Name' },
                        { key: 'role', title: 'Role' }
                      ],
                      rows: [
                        { name: 'John Doe', role: 'Admin' },
                        { name: 'Jane Smith', role: 'User' }
                      ]
                    }
                  }]
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget
        sessionId="test-session"
        wsUrl="ws://localhost:8000/ws/chat/"
        title="Test Chat"
        placeholder="Type a message..."
      />
    </div>
  );
}
