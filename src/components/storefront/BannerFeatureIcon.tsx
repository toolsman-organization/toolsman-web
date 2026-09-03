import React from 'react';
import {
  ShieldCheck,
  Wrench,
  Headphones,
  Truck,
  Award,
  CheckCircle2,
  Star,
  RefreshCw,
  Zap,
  Clock,
  Package,
  Sparkles,
} from 'lucide-react';
import type { BannerFeatureIcon } from '@/lib/bannerHelper';

interface Props {
  icon: BannerFeatureIcon;
  className?: string;
  size?: number;
}

export default function BannerFeatureIconComponent({ icon, className = 'text-orange-500', size = 16 }: Props) {
  switch (icon) {
    case 'shield':
      return <ShieldCheck size={size} className={className} />;
    case 'wrench':
      return <Wrench size={size} className={className} />;
    case 'headphones':
      return <Headphones size={size} className={className} />;
    case 'truck':
      return <Truck size={size} className={className} />;
    case 'award':
      return <Award size={size} className={className} />;
    case 'check':
      return <CheckCircle2 size={size} className={className} />;
    case 'star':
      return <Star size={size} className={className} />;
    case 'refresh':
      return <RefreshCw size={size} className={className} />;
    case 'zap':
      return <Zap size={size} className={className} />;
    case 'clock':
      return <Clock size={size} className={className} />;
    case 'package':
      return <Package size={size} className={className} />;
    case 'sparkles':
      return <Sparkles size={size} className={className} />;
    default:
      return <ShieldCheck size={size} className={className} />;
  }
}
