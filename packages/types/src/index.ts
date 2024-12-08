/**
 * Core type definitions for the chat application
 * @packageDocumentation
 */

/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** Username for display and identification */
  username: string;
  /** User's email address */
  email: string;
  /** Optional URL to user's avatar image */
  avatar?: string;
  /** Timestamp of when the user was created */
  createdAt: Date;
  /** Timestamp of last user activity */
  lastActive?: Date;
}

/**
 * Authentication response containing user data and token
 */
export interface AuthResponse {
  /** Authenticated user data */
  user: User;
  /** JWT token for authentication */
  token: string;
  /** Token expiration timestamp */
  expiresAt: number;
}

/**
 * Represents a chat message
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Message content */
  content: string;
  /** Reference to the message sender */
  sender: User;
  /** Timestamp when the message was sent */
  timestamp: Date;
  /** Optional reply reference to another message */
  replyTo?: Message;
  /** List of attachments, if any */
  attachments?: Array<{
    url: string;
    type: "image" | "file";
    name: string;
  }>;
}

/**
 * Represents a chat room or conversation
 */
export interface ChatRoom {
  /** Unique identifier for the chat room */
  id: string;
  /** List of users participating in the chat */
  participants: User[];
  /** Chat room name (optional for group chats) */
  name?: string;
  /** Last message in the chat room */
  lastMessage?: Message;
  /** Timestamp when the room was created */
  createdAt: Date;
  /** Timestamp of last activity in the room */
  updatedAt: Date;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Optional message for additional context */
  message?: string;
  /** Optional error details */
  error?: {
    code: string;
    details?: unknown;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Flag indicating if there are more pages */
  hasMore: boolean;
}

/**
 * WebSocket event types for chat
 */
export type WebSocketEvent = {
  type: "message" | "typing" | "presence" | "read";
  payload: unknown;
  roomId: string;
  userId: string;
  timestamp: number;
};
