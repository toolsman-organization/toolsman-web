import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Firoz P.',
    role: 'General Contractor, Malappuram',
    comment: 'Purchased 4 INGCO 20V Rotary Hammers for our site work. Outstanding battery life and the delivery was completed within 24 hours across Kerala!',
    rating: 5,
    verified: true,
  },
  {
    name: 'Muhammed Shafi',
    role: 'Workshop Owner, Calicut',
    comment: 'TOOLSMAN service support is the real deal. When my angle grinder needed carbon brush replacement, their service desk sorted it quickly with original spares.',
    rating: 5,
    verified: true,
  },
  {
    name: 'Rahul Menon',
    role: 'Interior Designer, Kochi',
    comment: 'Best competitive pricing for cordless kits in Kerala. Smooth checkout with UPI and crystal clear order tracking updates.',
    rating: 5,
    verified: true,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white border-b border-neutral-200">
      <div className="container-site">
        <div className="text-center max-w-xl mx-auto mb-10 lg:mb-12">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-1">
            Real Reviews From Real People
          </span>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-neutral-950 tracking-tight uppercase leading-tight">
            What Our Customers Say
          </h2>
        </div>

        {/* Testimonials Swipe Carousel on Mobile, 3-column Grid on Desktop */}
        <div className="flex md:grid md:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-none pb-2 md:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="w-[84vw] xs:w-[80vw] sm:w-[340px] md:w-auto flex-none snap-center md:flex-initial bg-neutral-50 p-4.5 sm:p-6 rounded-xl sm:rounded-2xl border border-neutral-200/90 hover:border-orange-500/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-500 text-amber-500 sm:w-3.5 sm:h-3.5" />
                    ))}
                  </div>
                  <Quote size={18} className="text-neutral-300 shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed italic">
                  &ldquo;{t.comment}&rdquo;
                </p>
              </div>

              <div className="mt-5 pt-3.5 sm:mt-6 sm:pt-4 border-t border-neutral-200/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">{t.name}</h4>
                  <p className="text-[11px] sm:text-xs text-neutral-500 truncate">{t.role}</p>
                </div>
                {t.verified && (
                  <span className="text-[9.5px] sm:text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                    Verified Buyer
                  </span>
                )}
              </div>
            </div>
          ))}
          {/* Right buffer for swipe */}
          <div className="flex-none w-1 md:hidden pointer-events-none" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
