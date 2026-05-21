import { Link } from "wouter";
import { Mail } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-foreground text-white/70 py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4 group inline-flex">
              <img src="/nibook-wordmark.png" alt="Nibook" className="h-32 w-auto brightness-0 invert group-hover:opacity-90 transition-opacity" />
            </Link>
            <p className="text-white/60 max-w-sm mb-6 leading-relaxed">
              The professional appointment booking and business management platform built specifically for service providers in East Africa.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors"><XIcon className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><InstagramIcon className="w-5 h-5" /></a>
              <a href="mailto:nibook@noonstudio.africa" className="hover:text-primary transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/referral" className="hover:text-white transition-colors text-accent font-medium">Refer & Earn 10%</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white mb-4">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/reviews" className="hover:text-white transition-colors">Leave a Review</Link></li>
              <li><Link href="/feature-requests" className="hover:text-white transition-colors">Request a Feature</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Nibook Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 text-sm">
            Made with <span className="text-destructive">❤️</span> in Nairobi.
          </p>
        </div>
      </div>
    </footer>
  );
}
