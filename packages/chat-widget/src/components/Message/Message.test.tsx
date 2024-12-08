import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Message } from "./Message";

describe("Message", () => {
  const defaultProps = {
    id: "1",
    content: "Hello, world!",
    timestamp: new Date("2024-03-19T12:00:00"),
    sender: "user" as const,
  };

  it("renders message content correctly", () => {
    render(<Message {...defaultProps} />);
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });

  it("formats timestamp correctly", () => {
    render(<Message {...defaultProps} />);
    expect(screen.getByText("12:00")).toBeInTheDocument();
  });

  it("applies correct classes for user message", () => {
    const { container } = render(<Message {...defaultProps} />);
    expect(container.firstChild).toHaveClass("message", "user");
  });

  it("applies correct classes for assistant message", () => {
    const { container } = render(
      <Message {...defaultProps} sender="assistant" />
    );
    expect(container.firstChild).toHaveClass("message", "assistant");
  });

  it("shows sending status", () => {
    render(<Message {...defaultProps} status="sending" />);
    expect(screen.getByText("Sending...")).toBeInTheDocument();
  });

  it("shows error status", () => {
    render(<Message {...defaultProps} status="error" />);
    expect(screen.getByText("Failed to send")).toBeInTheDocument();
  });

  it("calls onCopy when copy button is clicked", () => {
    const onCopy = vi.fn();
    render(<Message {...defaultProps} onCopy={onCopy} />);

    const copyButton = screen.getByLabelText("Copy message");
    fireEvent.click(copyButton);

    expect(onCopy).toHaveBeenCalled();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<Message {...defaultProps} onEdit={onEdit} />);

    const editButton = screen.getByLabelText("Edit message");
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<Message {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText("Delete message");
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalled();
  });

  it("only shows edit button for user messages", () => {
    const { rerender } = render(
      <Message {...defaultProps} sender="user" onEdit={() => {}} />
    );
    expect(screen.getByLabelText("Edit message")).toBeInTheDocument();

    rerender(
      <Message {...defaultProps} sender="assistant" onEdit={() => {}} />
    );
    expect(screen.queryByLabelText("Edit message")).not.toBeInTheDocument();
  });

  it("does not render action buttons when handlers are not provided", () => {
    render(<Message {...defaultProps} />);

    expect(screen.queryByLabelText("Copy message")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Edit message")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete message")).not.toBeInTheDocument();
  });
});
