import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Extend Vitest's expect with Testing Library's matchers
expect.extend({});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
