import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Share2 } from 'lucide-react';
import type { SiteSettings } from '@/types/database';

interface FooterProps {
  settings: SiteSettings;
}

const quickLinks = [
  { label: 'Shop All Products', href: '/shop' },
  { label: 'Power Tools', href: '/shop?search=power+tools' },
  { label: 'Hand Tools', href: '/shop?search=hand+tools' },
  { label: 'Accessories', href: '/shop?search=accessories' },
  { label: 'Offers', href: '/shop?sort=price-low' },
];

const accountLinks = [
  { label: 'My Account', href: '/account' },
  { label: 'My Orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Addresses', href: '/account/addresses' },
  { label: 'Cart', href: '/cart' },
];

export default function Footer({ settings }: FooterProps) {
  return (
    <footer style={{ backgroundColor: '#111111', color: '#d4d4d4' }}>
      {/* Main Footer */}
      <div className="container-site py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="TOOLSMAN Home">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1">
                <Image src="/logo.svg" alt="TOOLSMAN" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-none">TOOLSMAN</div>
                <div className="text-xs mt-0.5 font-bold" style={{ color: '#f97316' }}>SINCE 2025</div>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#a3a3a3' }}>
              {settings.store_tagline || 'Built for the job. Professional tools for serious performance.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm transition-colors hover:text-orange-400"
                    style={{ color: '#a3a3a3' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">My Account</h3>
            <ul className="space-y-2">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm transition-colors hover:text-orange-400"
                    style={{ color: '#a3a3a3' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-3">
              {settings.store_phone && (
                <li>
                  <a href={`tel:${settings.store_phone}`}
                    className="flex items-start gap-2 text-sm hover:text-orange-400 transition-colors"
                    style={{ color: '#a3a3a3' }}>
                    <Phone size={15} className="mt-0.5 shrink-0" style={{ color: '#f97316' }} />
                    {settings.store_phone}
                  </a>
                </li>
              )}
              {settings.store_email && (
                <li>
                  <a href={`mailto:${settings.store_email}`}
                    className="flex items-start gap-2 text-sm hover:text-orange-400 transition-colors"
                    style={{ color: '#a3a3a3' }}>
                    <Mail size={15} className="mt-0.5 shrink-0" style={{ color: '#f97316' }} />
                    {settings.store_email}
                  </a>
                </li>
              )}
              {settings.store_address && (
                <li>
                  <div className="flex items-start gap-2 text-sm" style={{ color: '#a3a3a3' }}>
                    <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: '#f97316' }} />
                    {settings.store_address}
                  </div>
                </li>
              )}
            </ul>

            {/* Payment icons */}
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#6b7280' }}>
                We Accept
              </div>
              <div className="flex gap-2 flex-wrap">
                {['UPI', 'Visa', 'Mastercard', 'RuPay', 'COD'].map((method) => (
                  <span key={method}
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{ backgroundColor: '#2d2d2d', color: '#d4d4d4' }}>
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid #2d2d2d' }}>
        <div className="container-site py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs" style={{ color: '#6b7280' }}>
            © {new Date().getFullYear()} TOOLSMAN. All rights reserved.
          </p>
          <div className="flex gap-4">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="text-xs hover:text-orange-400 transition-colors"
                style={{ color: '#6b7280' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
