import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | TOOLSMAN',
  description: 'Terms and conditions for purchasing power tools and equipment at TOOLSMAN.',
};

export default function TermsPage() {
  return (
    <div className="bg-neutral-50/50 min-h-screen py-10 sm:py-16 border-b border-neutral-200">
      <div className="container-site max-w-3xl">
        <Link href="/" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 mb-6">
          <ArrowLeft size={14} />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">
            <ShieldCheck size={16} />
            <span>Legal & Agreements</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight mb-6">
            Terms of Service
          </h1>

          <div className="prose prose-sm max-w-none text-neutral-700 text-xs sm:text-sm leading-relaxed space-y-4">
            <p>
              Welcome to <strong>TOOLSMAN</strong> (&ldquo;toolsman.in&rdquo;). By accessing our website, browsing our catalog, or purchasing power tools, equipment, and accessories, you agree to the following terms and conditions.
            </p>

            <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider pt-2">
              1. Product Authenticity & Warranty
            </h2>
            <p>
              All power tools and equipment sold on TOOLSMAN are 100% genuine and sourced directly from authorized brand distributors (including INGCO, Bosch, Makita, DeWalt, and others). Manufacturer warranty terms apply to each tool as specified in the product packaging and documentation.
            </p>

            <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider pt-2">
              2. Orders & Payments
            </h2>
            <p>
              Orders placed through our website are subject to acceptance and stock availability. We accept secure payments via Razorpay (UPI, Credit/Debit cards, Net Banking) as well as Cash on Delivery (COD) for eligible pin codes across Kerala.
            </p>

            <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider pt-2">
              3. Shipping & Delivery
            </h2>
            <p>
              Orders are dispatched promptly. Standard delivery timeframe across Kerala is 2 to 4 business days. Free shipping applies to orders meeting or exceeding the minimum spend threshold (₹999).
            </p>

            <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider pt-2">
              4. Service & Rental Assistance
            </h2>
            <p>
              TOOLSMAN provides sales, maintenance servicing, and tool rental inquiries through our support desk at <strong>+91 79944 10167</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
