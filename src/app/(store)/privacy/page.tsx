import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | TOOLSMAN',
  description: 'Privacy policy and data protection practices at TOOLSMAN.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-neutral-50/50 min-h-screen py-10 sm:py-16 border-b border-neutral-200">
      <div className="container-site max-w-3xl">
        <Link href="/" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 mb-6">
          <ArrowLeft size={14} />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">
            <Lock size={16} />
            <span>Security & Data Protection</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight mb-6">
            Privacy Policy
          </h1>

          <div className="prose prose-sm max-w-none text-neutral-700 text-xs sm:text-sm leading-relaxed space-y-4">
            <p>
              At <strong>TOOLSMAN</strong>, we value and respect your privacy. This policy outlines how your personal information is gathered, protected, and utilized during your visits and purchases.
            </p>

            <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider pt-2">
              1. Information We Collect
            </h2>
            <p>
              When you create an account, purchase tools, or request service support, we collect contact information (such as your name, phone number, delivery address in Kerala, and email) to ensure accurate order fulfillment and order updates.
            </p>

            <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider pt-2">
              2. Payment Security
            </h2>
            <p>
              All online card and UPI transactions are securely handled through Razorpay with end-to-end encryption. TOOLSMAN does not store or process sensitive credit/debit card numbers or UPI PINs on our servers.
            </p>

            <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider pt-2">
              3. Communication & Updates
            </h2>
            <p>
              We send automated order confirmations, dispatch tracking numbers, and invoice copies via transactional email (Brevo) or SMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
