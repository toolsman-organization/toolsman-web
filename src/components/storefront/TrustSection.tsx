import { ShieldCheck, CreditCard, Truck, HeadphonesIcon } from 'lucide-react';

const trustFeatures = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-orange-500 shrink-0" />,
    title: '100% Genuine Products',
    description: 'Only original and reliable brands backed by manufacturer warranty.',
  },
  {
    icon: <CreditCard className="w-8 h-8 text-orange-500 shrink-0" />,
    title: 'Secure Payments',
    description: 'Safe & multiple payment options including Razorpay, UPI & COD.',
  },
  {
    icon: <Truck className="w-8 h-8 text-orange-500 shrink-0" />,
    title: 'Fast Delivery',
    description: 'Quick & trackable doorstep delivery across Kerala & beyond.',
  },
  {
    icon: <HeadphonesIcon className="w-8 h-8 text-orange-500 shrink-0" />,
    title: 'After Sales Support',
    description: 'Dedicated expert team for servicing, repairs, and rent assistance.',
  },
];

export default function TrustSection() {
  return (
    <section className="py-8 bg-neutral-950 text-white border-y border-neutral-800">
      <div className="container-site">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80 hover:border-orange-500/40 transition-colors"
            >
              <div className="p-2.5 rounded-lg bg-neutral-800/80 flex items-center justify-center">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {feature.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
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
