import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
  ];

  const handleAuthClick = (type: string) => {
    // For demo purposes, route to dashboard directly
    setLocation("/dashboard");
    toast({
      title: "Welcome back!",
      description: "Redirecting to your dashboard...",
    });
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-border/50 py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">Nibook</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => handleAuthClick("Sign In")}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2"
          >
            Sign In
          </button>
          <button 
            onClick={() => handleAuthClick("Sign Up")}
            className="text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 hover:bg-primary/90 transition-all active:translate-y-0"
          >
            Get Started Free
          </button>
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
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-foreground p-2 hover:bg-muted rounded-lg"
            >
              {link.name}
            </a>
          ))}
          <div className="h-px bg-border my-2" />
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { handleAuthClick("Sign In"); setMobileMenuOpen(false); }}
              className="w-full text-center py-3 font-medium text-foreground border border-border rounded-xl"
            >
              Sign In
            </button>
            <button 
              onClick={() => { handleAuthClick("Sign Up"); setMobileMenuOpen(false); }}
              className="w-full text-center py-3 font-semibold bg-primary text-white rounded-xl shadow-lg shadow-primary/25"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
