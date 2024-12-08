import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";

describe("Header", () => {
  it("renders with default title", () => {
    render(<Header />);
    expect(screen.getByText("Chat Assistant")).toBeInTheDocument();
  });

  it("renders with custom title", () => {
    render(<Header title="Custom Title" />);
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("shows online status indicator by default", () => {
    const { container } = render(<Header />);
    const indicator = container.querySelector(".status-indicator");
    expect(indicator).toHaveClass("online");
  });

  it("shows offline status indicator when isOnline is false", () => {
    const { container } = render(<Header isOnline={false} />);
    const indicator = container.querySelector(".status-indicator");
    expect(indicator).toHaveClass("offline");
  });

  it("calls onMinimize when minimize button is clicked", () => {
    const onMinimize = vi.fn();
    render(<Header onMinimize={onMinimize} />);

    const minimizeButton = screen.getByLabelText("Minimize");
    fireEvent.click(minimizeButton);

    expect(onMinimize).toHaveBeenCalled();
  });

  it("calls onSettings when settings button is clicked", () => {
    const onSettings = vi.fn();
    render(<Header onSettings={onSettings} />);

    const settingsButton = screen.getByLabelText("Settings");
    fireEvent.click(settingsButton);

    expect(onSettings).toHaveBeenCalled();
  });

  it("does not render minimize button when onMinimize is not provided", () => {
    render(<Header />);
    expect(screen.queryByLabelText("Minimize")).not.toBeInTheDocument();
  });

  it("does not render settings button when onSettings is not provided", () => {
    render(<Header />);
    expect(screen.queryByLabelText("Settings")).not.toBeInTheDocument();
  });

  it("renders both minimize and settings buttons when handlers are provided", () => {
    render(<Header onMinimize={() => {}} onSettings={() => {}} />);

    expect(screen.getByLabelText("Minimize")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings")).toBeInTheDocument();
  });

  it("applies correct accessibility attributes to status indicator", () => {
    render(<Header />);
    const indicator = screen.getByRole("presentation");

    expect(indicator).toHaveAttribute("aria-hidden", "true");
  });

  it("renders header title as h2 element", () => {
    render(<Header title="Test Title" />);
    const heading = screen.getByRole("heading", { level: 2 });

    expect(heading).toHaveTextContent("Test Title");
  });
});
