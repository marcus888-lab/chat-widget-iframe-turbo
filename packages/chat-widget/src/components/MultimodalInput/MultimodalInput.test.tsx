import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultimodalInput } from "./MultimodalInput";

describe("MultimodalInput", () => {
  const onSendMessage = vi.fn();
  const onSendFile = vi.fn();
  const onStartVoice = vi.fn();
  const onStopVoice = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default placeholder", () => {
    render(<MultimodalInput onSendMessage={onSendMessage} />);
    expect(
      screen.getByPlaceholderText("Type a message...")
    ).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(
      <MultimodalInput
        onSendMessage={onSendMessage}
        placeholder="Custom placeholder"
      />
    );
    expect(
      screen.getByPlaceholderText("Custom placeholder")
    ).toBeInTheDocument();
  });

  it("sends message on form submit", () => {
    render(<MultimodalInput onSendMessage={onSendMessage} />);
    const input = screen.getByRole("textbox");
    const form = screen.getByRole("form");

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.submit(form);

    expect(onSendMessage).toHaveBeenCalledWith("Hello");
    expect(input).toHaveValue("");
  });

  it("sends message on Enter key", () => {
    render(<MultimodalInput onSendMessage={onSendMessage} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSendMessage).toHaveBeenCalledWith("Hello");
    expect(input).toHaveValue("");
  });

  it("does not send empty messages", () => {
    render(<MultimodalInput onSendMessage={onSendMessage} />);
    const form = screen.getByRole("form");

    fireEvent.submit(form);

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("handles file upload", () => {
    render(
      <MultimodalInput onSendMessage={onSendMessage} onSendFile={onSendFile} />
    );
    const fileInput = screen.getByLabelText("File input");
    const file = new File(["test"], "test.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onSendFile).toHaveBeenCalledWith(file);
  });

  it("handles voice recording", () => {
    render(
      <MultimodalInput
        onSendMessage={onSendMessage}
        onStartVoice={onStartVoice}
        onStopVoice={onStopVoice}
      />
    );
    const voiceButton = screen.getByLabelText("Start recording");

    fireEvent.click(voiceButton);
    expect(onStartVoice).toHaveBeenCalled();
    expect(screen.getByLabelText("Stop recording")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Stop recording"));
    expect(onStopVoice).toHaveBeenCalled();
  });

  it("handles disabled state", () => {
    render(<MultimodalInput onSendMessage={onSendMessage} disabled={true} />);
    const input = screen.getByRole("textbox");
    const sendButton = screen.getByLabelText("Send message");

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it("respects maxLength constraint", () => {
    render(<MultimodalInput onSendMessage={onSendMessage} maxLength={5} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "123456" } });
    expect(input).toHaveValue("123456"); // Value is still set but...
    expect(input).toHaveAttribute("maxLength", "5"); // maxLength is enforced by browser
  });

  it("handles image paste", () => {
    render(
      <MultimodalInput onSendMessage={onSendMessage} onSendFile={onSendFile} />
    );
    const input = screen.getByRole("textbox");
    const file = new File(["test"], "test.png", { type: "image/png" });
    const clipboardData = {
      items: [{ type: "image/png", getAsFile: () => file }],
    };

    fireEvent.paste(input, { clipboardData });

    expect(onSendFile).toHaveBeenCalledWith(file);
  });

  it("preserves line breaks with Shift+Enter", () => {
    render(<MultimodalInput onSendMessage={onSendMessage} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(onSendMessage).not.toHaveBeenCalled();
  });
});
