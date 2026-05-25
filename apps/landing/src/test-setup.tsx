import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => children,
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
  },
}));
