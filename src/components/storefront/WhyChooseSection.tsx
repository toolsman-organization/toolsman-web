import { Award, PenTool, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

const reasons = [
  {
    icon: <Award className="w-6 h-6 text-orange-500" />,
    title: 'Certified Authority',
    description: 'Direct partner of top-tier industrial power tool brands including INGCO, Bosch, Makita, and DeWalt.',
  },
  {
    icon: <PenTool className="w-6 h-6 text-orange-500" />,
    title: 'In-House Service Center',
    description: 'Specialized maintenance, genuine spare parts replacement, and skilled technicians ready to assist.',
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-orange-500" />,
    title: 'Tool Rental Options',
    description: 'Need tools for a short-term contract? Rent heavy equipment with zero maintenance hassle.',
  },
  {
    icon: <Clock className="w-6 h-6 text-orange-500" />,
    title: 'Same-Day Dispatch',
    description: 'Orders placed before 2 PM are packed and handed over to logistics partners on the very same day.',
  },
];

export default function WhyChooseSection() {
  return (
    <section className="py-12 sm:py-16 bg-neutral-100/70 border-b border-neutral-200">
      <div className="container-site">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            The Toolsman Promise
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight mt-1">
            WHY CHOOSE TOOLSMAN?
          </h2>
          <p className="text-sm text-neutral-600 mt-2">
            Engineered for professionals, contractors, mechanics, and serious DIY builders who demand unyielding reliability and robust power.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                {reason.icon}
              </div>
              <h3 className="text-base font-black text-neutral-900 mb-2">
                {reason.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {reason.description}
              </p>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={14} />
                <span>Verified Quality</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
