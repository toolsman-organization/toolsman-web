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
    <section className="py-12 sm:py-16 bg-white border-b border-neutral-200">
      <div className="container-site">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Real Reviews From Real People
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight mt-1 uppercase">
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-neutral-50 p-6 rounded-xl border border-neutral-200/70 hover:border-orange-500/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <Quote size={20} className="text-neutral-300" />
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed italic">
                  &ldquo;{t.comment}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200/60 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{t.name}</h4>
                  <p className="text-xs text-neutral-500">{t.role}</p>
                </div>
                {t.verified && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Verified Buyer
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
