import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | TOOLSMAN',
  description: 'Privacy policy and data protection practices at TOOLSMAN.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | TOOLSMAN',
    description: 'Privacy policy and data protection practices at TOOLSMAN.',
  },
};

export default function PrivacyPage() {
  return (
    <div className="bg-neutral-50/60 min-h-screen py-10 sm:py-16 border-b border-neutral-200">
      <div className="container-site max-w-3xl">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="text-xs font-bold text-neutral-500 hover:text-orange-600 inline-flex items-center gap-1.5 mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        {/* Document Card */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 shadow-sm">
          {/* Header */}
          <div className="border-b border-neutral-100 pb-5 mb-6">
            <div className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest mb-2">
               
              <span>Security & Data Protection</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
              Privacy Policy
            </h1>
          </div>

          {/* Policy Content */}
          <div className="space-y-6 text-neutral-700 text-xs sm:text-sm leading-relaxed">
            <p>
              At <strong>TOOLSMAN</strong>, we value your trust and are committed to protecting your personal privacy. This Privacy Policy outlines how your information is collected, used, and safeguarded when you visit our website or make a purchase.
            </p>

            {/* 1. Information We Collect */}
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-wider">
                1. Information We Collect
              </h2>
              <p>
                When you create an account, purchase tools, or contact our support team, we may collect:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-600">
                <li>Your name, email address, and phone number.</li>
                <li>Delivery address and postal PIN code for shipping.</li>
                <li>Order history and transaction details.</li>
              </ul>
            </div>

            {/* 2. How We Use Your Information */}
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-wider">
                2. How We Use Your Information
              </h2>
              <p>We use your information exclusively to provide and improve our services, including:</p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-600">
                <li>Processing, packing, and delivering your tool orders.</li>
                <li>Sending order confirmations, tracking updates, and invoices.</li>
                <li>Assisting with customer support, warranties, and service queries.</li>
                <li>Maintaining website security and preventing fraudulent transactions.</li>
              </ul>
            </div>

            {/* 3. Payment Security */}
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-wider">
                3. Payment Security
              </h2>
              <p>
                All online payments (UPI, Credit/Debit Cards, and Net Banking) are securely processed through encrypted payment gateway partners. TOOLSMAN does not store or process your sensitive credit/debit card numbers, CVVs, or UPI PINs on our servers.
              </p>
            </div>

            {/* 4. Information Sharing */}
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-wider">
                4. Information Sharing
              </h2>
              <p>
                We do not sell, rent, or trade your personal information to third parties. We share necessary details only with trusted delivery partners and payment processors strictly to fulfill your orders.
              </p>
            </div>

            {/* 5. Cookies & Browsing */}
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-wider">
                5. Cookies
              </h2>
              <p>
                We use standard cookies to keep your shopping cart active and remember your session preferences while you browse our store.
              </p>
            </div>

            {/* 6. Your Rights */}
            <div className="space-y-2">
              <h2 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-wider">
                6. Your Rights
              </h2>
              <p>
                You can review or update your personal details and saved addresses anytime by logging into your account dashboard.
              </p>
            </div>

            {/* 7. Contact Us */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <h2 className="text-sm sm:text-base font-black text-neutral-950 uppercase tracking-wider">
                7. Contact Us
              </h2>
              <p>
                If you have any questions regarding this Privacy Policy, please reach out to us:
              </p>
              <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 space-y-1 text-xs text-neutral-600">
                <p><strong>Email:</strong> support@toolsman.in</p>
                <p><strong>Phone:</strong> +91 79944 10167</p>
                <p><strong>Support:</strong> Monday – Saturday (9:00 AM – 7:00 PM IST)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
