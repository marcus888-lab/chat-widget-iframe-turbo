import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

describe("Home Page", () => {
  it("renders welcome message", () => {
    render(<Home />);
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
  });

  it("renders form inputs", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders remember me checkbox", () => {
    render(<Home />);
    expect(screen.getByLabelText("Remember me")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<Home />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.getByText("Sign up")).toBeInTheDocument();
  });

  it("renders forgot password link", () => {
    render(<Home />);
    expect(screen.getByText("Forgot your password?")).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const emailInput = screen.getByPlaceholderText("Email address");
    const passwordInput = screen.getByPlaceholderText("Password");
    const signInButton = screen.getByText("Sign in");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(signInButton);

    // Add assertions for form submission when implemented
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });
});
