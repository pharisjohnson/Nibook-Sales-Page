import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import { ProfileProvider } from "./lib/profile";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ProfileProvider>
      <App />
    </ProfileProvider>
  </AuthProvider>
);
