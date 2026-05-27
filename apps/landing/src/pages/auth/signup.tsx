import { useLocation } from "wouter";
import { AuthModal } from "@/components/landing/AuthModal";
import { ROUTES } from "@/lib/routes";

export default function SignupPage() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center px-4">
      <AuthModal
        open
        defaultTab="signup"
        onClose={() => navigate(ROUTES.home)}
      />
    </div>
  );
}
