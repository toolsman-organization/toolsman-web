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
    <section className="py-12 sm:py-16 lg:py-20 bg-neutral-100/70 border-b border-neutral-200">
      <div className="container-site">

        {/* Section Heading */}
        <div className="max-w-2xl mb-10 lg:mb-12">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-2">
            The Toolsman Promise
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-950 tracking-tight leading-tight mb-3">
            WHY CHOOSE TOOLSMAN?
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            Engineered for professionals, contractors, mechanics, and serious DIY builders who demand unyielding reliability and robust power.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {reasons.map((reason, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl border border-neutral-200/80 shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-250 flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-4 shrink-0">
                {reason.icon}
              </div>
              <h3 className="text-sm font-black text-neutral-900 mb-2 leading-snug">
                {reason.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed flex-1">
                {reason.description}
              </p>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={13} />
                <span>Verified Quality</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
