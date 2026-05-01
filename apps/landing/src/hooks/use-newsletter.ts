import { useMutation } from "@tanstack/react-query";

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: async (email: string) => {
      // Simulate API call for newsletter subscription
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }
      return { success: true, email };
    },
  });
}
