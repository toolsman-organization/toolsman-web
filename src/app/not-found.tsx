import Link from 'next/link';
import Image from 'next/image';
import { Wrench, Home, ShoppingBag, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-neutral-200 shadow-sm">
        {/* Logo / Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shadow-inner">
            <Wrench size={32} className="rotate-45" />
          </div>
        </div>

        {/* 404 Heading */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Error 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            The tool, equipment, or page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Search Helper / Action Buttons */}
        <div className="pt-2 space-y-3">
          <Link
            href="/shop"
            className="w-full btn-primary py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-orange-500/20 active:scale-98 transition-all"
          >
            <ShoppingBag size={17} />
            <span>Browse Tool Catalog</span>
          </Link>

          <Link
            href="/"
            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold active:scale-98 transition-all"
          >
            <Home size={17} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-4 border-t border-neutral-100 text-xs text-neutral-500">
          <span>Need help finding a tool? </span>
          <Link href="/contact" className="text-orange-600 font-semibold hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
