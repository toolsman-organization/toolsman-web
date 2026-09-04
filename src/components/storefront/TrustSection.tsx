import { ShieldCheck, CreditCard, Truck, HeadphonesIcon } from 'lucide-react';

const trustFeatures = [
  {
    icon: <ShieldCheck className="w-7 h-7 text-orange-500 shrink-0" />,
    title: '100% Genuine Products',
    description: 'Only original and reliable brands backed by manufacturer warranty.',
  },
  {
    icon: <CreditCard className="w-7 h-7 text-orange-500 shrink-0" />,
    title: 'Secure Payments',
    description: 'Safe & multiple payment options including Razorpay, UPI & COD.',
  },
  {
    icon: <Truck className="w-7 h-7 text-orange-500 shrink-0" />,
    title: 'Fast Delivery',
    description: 'Quick & trackable doorstep delivery across Kerala & beyond.',
  },
  {
    icon: <HeadphonesIcon className="w-7 h-7 text-orange-500 shrink-0" />,
    title: 'After Sales Support',
    description: 'Dedicated expert team for servicing, repairs, and rent assistance.',
  },
];

export default function TrustSection() {
  return (
    <section className="py-6 sm:py-10 bg-neutral-950 text-white border-y border-neutral-850">
      <div className="container-site">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {trustFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-900/80 border border-neutral-800/90 hover:border-orange-500/50 transition-colors shadow-2xs"
            >
              <div className="p-2 sm:p-2.5 rounded-lg bg-neutral-800/90 flex items-center justify-center shrink-0 border border-neutral-700/50">
                {feature.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide leading-tight mb-1">
                  {feature.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
