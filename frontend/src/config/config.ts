import { 
  Wrench, Stethoscope, Smile, Droplets, 
  Zap, Scale, BarChart3, Briefcase
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CategoryConfig {
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const categories: Record<string, CategoryConfig> = {
  mechanic: {
    name: 'Mechanic',
    icon: Wrench,
    color: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.1)',
  },
  doctor: {
    name: 'Doctor',
    icon: Stethoscope,
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.1)',
  },
  cleaner: {
    name: 'Cleaner',
    icon: Smile,
    color: '#9333ea',
    bgColor: 'rgba(147, 51, 234, 0.1)',
  },
  plumber: {
    name: 'Plumber',
    icon: Droplets,
    color: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.1)',
  },
  electrician: {
    name: 'Electrician',
    icon: Zap,
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.1)',
  },
  legal: {
    name: 'Legal',
    icon: Scale,
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
  },
  financial: {
    name: 'Financial',
    icon: BarChart3,
    color: '#4f46e5',
    bgColor: 'rgba(79, 70, 229, 0.1)',
  },
  consultant: {
    name: 'Consultant',
    icon: Briefcase,
    color: '#be185d',
    bgColor: 'rgba(190, 24, 93, 0.1)',
  },
};
