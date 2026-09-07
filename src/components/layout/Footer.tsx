'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import type { SiteSettings } from '@/types/database';

interface FooterProps {
  settings: SiteSettings;
}

const quickLinks = [
  { label: 'Shop All Products', href: '/shop' },
  { label: 'Power Tools', href: '/shop?search=power+tools' },
  { label: 'Hand Tools', href: '/shop?search=hand+tools' },
  { label: 'Accessories', href: '/shop?search=accessories' },
  { label: 'Special Offers', href: '/shop?sort=price-low' },
];

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Delivery & Shipping', href: '/terms' },
];

const accountLinks = [
  { label: 'My Account', href: '/account' },
  { label: 'My Orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Saved Addresses', href: '/account/addresses' },
  { label: 'Shopping Cart', href: '/cart' },
];

export default function Footer({ settings }: FooterProps) {
  // Mobile accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quick: false,
    company: false,
    account: false,
    contact: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer style={{ backgroundColor: '#0f0f0f', color: '#d4d4d4' }} className="border-t border-neutral-850 select-none">
      {/* Main Footer Container */}
      <div className="container-site py-10 sm:py-14 lg:py-16">
        
        {/* =========================================================================
            DESKTOP LAYOUT (sm: and up) — Balanced 4-Column Grid
            ========================================================================= */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
          
          {/* Column 1: Brand Info (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group" aria-label="TOOLSMAN Home">
              <div className="w-12 h-12 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Image src="/logo.png" alt="TOOLSMAN" width={48} height={48} className="w-full h-full object-contain" />
              </div>
              <div className="text-white font-black text-2xl tracking-wider leading-none uppercase">
                TOOLSMAN
              </div>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-neutral-400 max-w-xs">
              {settings.store_tagline || 'Built for the job. Professional heavy-duty power tools, equipment, and genuine machinery for serious performance.'}
            </p>

            <div className="pt-2 text-xs text-neutral-500 space-y-1.5">
              {settings.store_phone && (
                <a href={`tel:${settings.store_phone}`} className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                  <Phone size={13} className="text-orange-500 shrink-0" />
                  <span>{settings.store_phone}</span>
                </a>
              )}
              {settings.store_email && (
                <a href={`mailto:${settings.store_email}`} className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                  <Mail size={13} className="text-orange-500 shrink-0" />
                  <span className="truncate">{settings.store_email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm transition-colors hover:text-orange-400 text-neutral-400 hover:translate-x-0.5 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company & Legal (3 cols) */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-4">
              Company & Legal
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm transition-colors hover:text-orange-400 text-neutral-400 hover:translate-x-0.5 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: My Account (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-4">
              My Account
            </h3>
            <ul className="space-y-2.5">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm transition-colors hover:text-orange-400 text-neutral-400 hover:translate-x-0.5 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* =========================================================================
            MOBILE LAYOUT (sm:hidden) — Brand Header + Interactive Accordions + Right Payment Card
            ========================================================================= */}
        <div className="flex sm:hidden flex-col gap-4">
          
          {/* Mobile Brand Info */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-2.5" aria-label="TOOLSMAN Home">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Image src="/logo.png" alt="TOOLSMAN" width={40} height={40} className="w-full h-full object-contain" />
              </div>
              <div className="text-white font-black text-xl tracking-wider leading-none uppercase">
                TOOLSMAN
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-neutral-400">
              {settings.store_tagline || 'Built for the job. Genuine power tools & industrial equipment across Kerala.'}
            </p>
          </div>

          {/* Accordion 1: Quick Links */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection('quick')}
              className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-white"
              aria-expanded={openSections.quick}
            >
              <span>Quick Links</span>
              <ChevronDown
                size={16}
                className={`text-neutral-400 transition-transform duration-200 ${
                  openSections.quick ? 'rotate-180 text-orange-500' : ''
                }`}
              />
            </button>
            {openSections.quick && (
              <ul className="pt-2 pb-1 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block text-xs py-0.5 text-neutral-400 hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Accordion 2: Company & Legal */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection('company')}
              className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-white"
              aria-expanded={openSections.company}
            >
              <span>Company & Legal</span>
              <ChevronDown
                size={16}
                className={`text-neutral-400 transition-transform duration-200 ${
                  openSections.company ? 'rotate-180 text-orange-500' : ''
                }`}
              />
            </button>
            {openSections.company && (
              <ul className="pt-2 pb-1 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block text-xs py-0.5 text-neutral-400 hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Accordion 3: My Account */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection('account')}
              className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-white"
              aria-expanded={openSections.account}
            >
              <span>My Account</span>
              <ChevronDown
                size={16}
                className={`text-neutral-400 transition-transform duration-200 ${
                  openSections.account ? 'rotate-180 text-orange-500' : ''
                }`}
              />
            </button>
            {openSections.account && (
              <ul className="pt-2 pb-1 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {accountLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block text-xs py-0.5 text-neutral-400 hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Accordion 4: Contact & Showroom Info */}
          <div>
            <button
              type="button"
              onClick={() => toggleSection('contact')}
              className="w-full flex items-center justify-between py-2 text-left font-bold text-xs uppercase tracking-wider text-white"
              aria-expanded={openSections.contact}
            >
              <span>Contact & Showroom</span>
              <ChevronDown
                size={16}
                className={`text-neutral-400 transition-transform duration-200 ${
                  openSections.contact ? 'rotate-180 text-orange-500' : ''
                }`}
              />
            </button>
            {openSections.contact && (
              <div className="pt-3 pb-1 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
                {settings.store_phone && (
                  <a
                    href={`tel:${settings.store_phone}`}
                    className="flex items-start gap-2 text-neutral-400 hover:text-orange-400 transition-colors"
                  >
                    <Phone size={14} className="mt-0.5 shrink-0 text-orange-500" />
                    <span>{settings.store_phone}</span>
                  </a>
                )}
                {settings.store_email && (
                  <a
                    href={`mailto:${settings.store_email}`}
                    className="flex items-start gap-2 text-neutral-400 hover:text-orange-400 transition-colors"
                  >
                    <Mail size={14} className="mt-0.5 shrink-0 text-orange-500" />
                    <span className="break-all">{settings.store_email}</span>
                  </a>
                )}
                {settings.store_address && (
                  <div className="flex items-start gap-2 text-neutral-400">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-orange-500" />
                    <span>{settings.store_address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Clean Bottom Copyright Bar */}
      <div style={{ borderTop: '1px solid #1c1c1c' }} className="bg-black/50">
        <div className="container-site py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} TOOLSMAN. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500">
            Powered by{' '}
            <span className="text-neutral-400 font-medium">Ekodrix</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
