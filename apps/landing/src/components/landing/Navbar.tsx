import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, Menu, X, Map, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: "signin" | "signup" }>({ open: false, tab: "signin" });
  const [, navigate] = useLocation();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Directory", href: "/directory" },
  ];

  function openAuth(tab: "signin" | "signup") {
    setMobileMenuOpen(false);
    setAuthModal({ open: true, tab });
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
    setMobileMenuOpen(false);
  }

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-border/50 py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img src="/nibook-wordmark.png" alt="Nibook" className="h-9 w-auto group-hover:opacity-90 transition-opacity" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link key={link.name} href={link.href}>
                  <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer">
                    {link.name === "Directory" && <Map className="w-3.5 h-3.5" />}
                    {link.name}
                  </span>
                </Link>
              ) : (
                <a key={link.name} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  {link.name}
                </a>
              )
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuth("signin")}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 hover:bg-primary/90 transition-all active:translate-y-0"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link key={link.name} href={link.href}>
                  <span
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-foreground p-2 hover:bg-muted rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    {link.name === "Directory" && <Map className="w-4 h-4 text-primary" />}
                    {link.name}
                  </span>
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground p-2 hover:bg-muted rounded-lg"
                >
                  {link.name}
                </a>
              )
            )}
            <div className="h-px bg-border my-2" />
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}
                    className="w-full text-center py-3 font-semibold bg-primary text-white rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-center py-3 font-medium text-foreground border border-border rounded-xl flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuth("signin")}
                    className="w-full text-center py-3 font-medium text-foreground border border-border rounded-xl"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuth("signup")}
                    className="w-full text-center py-3 font-semibold bg-primary text-white rounded-xl shadow-lg shadow-primary/25"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        open={authModal.open}
        onClose={() => setAuthModal(a => ({ ...a, open: false }))}
        defaultTab={authModal.tab}
      />
    </>
  );
}
