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
    <section className="py-8 sm:py-14 lg:py-18 bg-neutral-100/70 border-b border-neutral-200">
      <div className="container-site">

        {/* Section Heading */}
        <div className="max-w-2xl mb-6 sm:mb-10">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-1.5">
            The Toolsman Promise
          </span>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-neutral-950 tracking-tight leading-tight mb-2">
            WHY CHOOSE TOOLSMAN?
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed">
            Engineered for professionals, contractors, mechanics, and serious DIY builders who demand unyielding reliability and robust power.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
          {reasons.map((reason, idx) => (
            <div
              key={idx}
              className="bg-white p-4.5 sm:p-6 rounded-xl sm:rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md hover:border-orange-500 transition-all duration-250 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-3 sm:mb-4 shrink-0">
                  {reason.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-black text-neutral-900 mb-1.5 sm:mb-2 leading-snug">
                  {reason.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {reason.description}
                </p>
              </div>
              <div className="mt-4 pt-3 sm:mt-5 sm:pt-4 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-700">
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
