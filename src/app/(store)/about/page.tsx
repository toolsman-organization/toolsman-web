import Link from 'next/link';
import { ArrowLeft, Wrench, ShieldCheck, Truck, HeadphonesIcon, Award, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'About Us | TOOLSMAN',
  description: 'Learn about TOOLSMAN — your trusted partner for professional power tools, machinery sales, and equipment servicing in Kerala.',
};

export default function AboutPage() {
  return (
    <div className="bg-neutral-50/50 min-h-screen py-10 sm:py-16 border-b border-neutral-200">
      <div className="container-site max-w-4xl">
        <Link href="/" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 mb-6">
          <ArrowLeft size={14} />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 shadow-sm space-y-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">
              <Wrench size={16} />
              <span>Built for the Job</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 uppercase tracking-tight">
              About TOOLSMAN
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base mt-3 leading-relaxed">
              TOOLSMAN is Kerala&apos;s premier destination for heavy-duty power tools, construction equipment, industrial machinery, and accessories. We empower contractors, craftsmen, and DIY enthusiasts with genuine, high-performance equipment from world-class brands.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-neutral-100">
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <Award className="w-8 h-8 text-orange-500" />
              <h3 className="font-black text-sm text-neutral-950 uppercase">100% Genuine</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Direct authorized partner for Bosch, Dewalt, Makita, DongCheng, and other top global manufacturers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <Truck className="w-8 h-8 text-orange-500" />
              <h3 className="font-black text-sm text-neutral-950 uppercase">Fast Delivery</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Reliable doorstep delivery across all districts in Kerala with transparent, weight-based pricing.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <HeadphonesIcon className="w-8 h-8 text-orange-500" />
              <h3 className="font-black text-sm text-neutral-950 uppercase">Expert Service</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Dedicated repair and service specialists ready to help with maintenance, spare parts, and tool care.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-neutral-100 text-xs sm:text-sm text-neutral-700 leading-relaxed">
            <h2 className="text-base sm:text-lg font-black text-neutral-950 uppercase tracking-wide">
              Our Mission
            </h2>
            <p>
              We believe that quality tools build strong foundations. Our mission is to provide tradespeople with reliable, durable, and cost-effective tools backed by unmatched after-sales support and authentic warranties.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                'Authorized warranty and authentic spares',
                'Comprehensive selection of cordless & corded tools',
                'Transparent pricing & weight-based doorstep delivery',
                'Dedicated repair hub & service center in Malappuram',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-500 text-center sm:text-left">
              Have questions or need bulk industrial quotes?
            </div>
            <Link
              href="/shop"
              className="btn-primary px-6 py-3 text-xs font-bold uppercase tracking-wider"
            >
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
