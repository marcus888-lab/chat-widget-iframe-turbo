import { describe, it, expect } from "vitest";
import type {
  User,
  Message,
  ChatRoom,
  ApiResponse,
  PaginatedResponse,
  WebSocketEvent,
} from "./index";

describe("Type Definitions", () => {
  it("should create a valid User object", () => {
    const user: User = {
      id: "123",
      username: "testuser",
      email: "test@example.com",
      createdAt: new Date(),
      avatar: "https://example.com/avatar.jpg",
    };

    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("username");
    expect(user).toHaveProperty("email");
  });

  it("should create a valid Message object", () => {
    const message: Message = {
      id: "123",
      content: "Hello, world!",
      sender: {
        id: "456",
        username: "sender",
        email: "sender@example.com",
        createdAt: new Date(),
      },
      timestamp: new Date(),
      attachments: [
        {
          url: "https://example.com/file.pdf",
          type: "file",
          name: "document.pdf",
        },
      ],
    };

    expect(message).toHaveProperty("id");
    expect(message).toHaveProperty("content");
    expect(message.sender).toHaveProperty("username");
  });

  it("should create a valid ChatRoom object", () => {
    const chatRoom: ChatRoom = {
      id: "123",
      participants: [
        {
          id: "456",
          username: "user1",
          email: "user1@example.com",
          createdAt: new Date(),
        },
      ],
      name: "Test Room",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(chatRoom).toHaveProperty("id");
    expect(chatRoom.participants).toBeInstanceOf(Array);
  });

  it("should create a valid ApiResponse", () => {
    const response: ApiResponse<User> = {
      data: {
        id: "123",
        username: "testuser",
        email: "test@example.com",
        createdAt: new Date(),
      },
      status: 200,
      message: "Success",
    };

    expect(response).toHaveProperty("data");
    expect(response).toHaveProperty("status");
  });

  it("should create a valid PaginatedResponse", () => {
    const paginatedResponse: PaginatedResponse<Message> = {
      data: [],
      total: 100,
      page: 1,
      pageSize: 10,
      totalPages: 10,
      hasMore: true,
    };

    expect(paginatedResponse).toHaveProperty("data");
    expect(paginatedResponse).toHaveProperty("total");
    expect(paginatedResponse).toHaveProperty("hasMore");
  });

  it("should create a valid WebSocketEvent", () => {
    const event: WebSocketEvent = {
      type: "message",
      payload: { content: "Hello" },
      roomId: "123",
      userId: "456",
      timestamp: Date.now(),
    };

    expect(event.type).toBe("message");
    expect(event).toHaveProperty("payload");
  });
});
