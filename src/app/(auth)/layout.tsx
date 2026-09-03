import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background industrial pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
        }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1 shadow-lg">
            <Image
              src="/logo.png"
              alt="TOOLSMAN"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="text-left">
            <span className="text-white font-black text-2xl tracking-wider block leading-none">
              TOOLSMAN
            </span>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
              SALES • SERVICE • RENT
            </span>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-neutral-800">
          {children}
        </div>
      </div>
    </div>
  );
}
