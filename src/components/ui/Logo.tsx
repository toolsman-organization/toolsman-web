import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  inverted?: boolean;
  href?: string;
}

export default function Logo({
  className = '',
  size = 40,
  showText = true,
  inverted = false,
  href = '/',
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-full bg-white p-1"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="TOOLSMAN"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-wider leading-none text-lg ${inverted ? 'text-white' : 'text-gray-950'}`} style={{ fontFamily: 'var(--font-sans)' }}>
            TOOLSMAN
          </span>
          <span className="text-[10px] font-bold tracking-widest text-orange-500 uppercase mt-0.5">
            SALES • SERVICE • RENT
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-95 transition-opacity" aria-label="TOOLSMAN Home">
        {content}
      </Link>
    );
  }

  return content;
}
