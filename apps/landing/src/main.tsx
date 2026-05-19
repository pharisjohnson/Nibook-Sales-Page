import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import { initAnalytics } from "./lib/analytics";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import { ProfileProvider } from "./lib/profile";
import "./index.css";

initSentry();
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ProfileProvider>
      <App />
    </ProfileProvider>
  </AuthProvider>
);
