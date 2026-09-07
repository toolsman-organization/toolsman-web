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
  size = 48,
  showText = true,
  inverted = false,
  href = '/',
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="TOOLSMAN"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-black tracking-wider leading-none text-xl ${inverted ? 'text-white' : 'text-gray-950'}`} style={{ fontFamily: 'var(--font-sans)' }}>
          TOOLSMAN
        </span>
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
