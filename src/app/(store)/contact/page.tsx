import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { getSiteSettings } from '@/services/settings';

export const metadata = {
  title: 'Contact Us | TOOLSMAN',
  description: 'Get in touch with TOOLSMAN for tool inquiries, machinery sales, servicing, and bulk orders across Kerala.',
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="bg-neutral-50/50 min-h-screen py-10 sm:py-16 border-b border-neutral-200">
      <div className="container-site max-w-5xl">
        <Link
          href="/"
          className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>

        {/* Header section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">
            <MessageSquare size={16} />
            <span>Customer Support</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 uppercase tracking-tight">
            Contact Customer Care
          </h1>
          <p className="text-neutral-600 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Need assistance with product selection, order tracking, bulk procurement, or tool repairs? We are here to help you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Phone Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                <Phone size={20} />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Phone Helpline</h3>
                <a
                  href={`tel:${settings.store_phone || '+917994410167'}`}
                  className="text-sm sm:text-base font-bold text-neutral-900 hover:text-orange-600 transition-colors block"
                >
                  {settings.store_phone || '+91 79944 10167'}
                </a>
                <p className="text-xs text-neutral-500">Mon - Sat: 8:30 AM - 8:00 PM</p>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                <Mail size={20} />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Email Support</h3>
                <a
                  href={`mailto:${settings.store_email || 'info@toolsman.in'}`}
                  className="text-sm sm:text-base font-bold text-neutral-900 hover:text-orange-600 transition-colors block truncate"
                >
                  {settings.store_email || 'info@toolsman.in'}
                </a>
                <p className="text-xs text-neutral-500">Fast response within 24 hours</p>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                <MapPin size={20} />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Store & Showroom</h3>
                <p className="text-xs sm:text-sm font-medium text-neutral-800 leading-relaxed">
                  {settings.store_address || 'Tirur, Puthanathani, Malappuram, Kerala - 676552'}
                </p>
              </div>
            </div>

            {/* Hours Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                <Clock size={20} />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Working Hours</h3>
                <p className="text-xs sm:text-sm font-semibold text-neutral-800">
                  Monday – Saturday: 8:30 AM – 8:00 PM
                </p>
                <p className="text-xs text-neutral-500">Sunday: Closed</p>
              </div>
            </div>
          </div>

          {/* Quick Inquiry Form / Direct Support (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 shadow-sm">
            <h2 className="text-lg sm:text-xl font-black text-neutral-950 uppercase tracking-tight mb-2">
              Send an Inquiry
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6">
              Have a question about tools, servicing, or special pricing? Send us a message and our team will get back to you promptly.
            </p>

            <form
              action={`mailto:${settings.store_email || 'info@toolsman.in'}`}
              method="GET"
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-neutral-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-neutral-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Subject / Inquiry Type
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="e.g., Tool Inquiry / Service Support / Bulk Order"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-neutral-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Message
                </label>
                <textarea
                  name="body"
                  rows={4}
                  required
                  placeholder="Tell us what you need..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-neutral-50/50 resize-none"
                ></textarea>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto px-7 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  <span>Send Message</span>
                </button>

                {settings.store_phone && (
                  <a
                    href={`https://wa.me/${settings.store_phone.replace(/[^0-9]/g, '')}?text=Hi%20TOOLSMAN,%20I%20have%20an%20inquiry.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                  >
                    <span>Or chat on WhatsApp</span>
                    <span>→</span>
                  </a>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
