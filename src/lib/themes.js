import { Flame, Cross, LifeBuoy } from 'lucide-react';

export const THEMES = {
  fire: {
    id: 'fire',
    label: 'Fire Emergency',
    short: 'Fire',
    color: 'red',
    hex: '#DC2626',
    darkHex: '#B91C1C',
    softHex: '#FEF2F2',
    borderHex: '#FCA5A5',
    bgLight: 'bg-red-50',
    text: 'text-red-600',
    bg: 'bg-red-600',
    border: 'border-red-600',
    hover: 'hover:bg-red-700',
    icon: Flame
  },
  medical: {
    id: 'medical',
    label: 'Medical Response',
    short: 'Medical',
    color: 'green',
    hex: '#16A34A',
    darkHex: '#15803D',
    softHex: '#F0FDF4',
    borderHex: '#86EFAC',
    bgLight: 'bg-green-50',
    text: 'text-green-600',
    bg: 'bg-green-600',
    border: 'border-green-600',
    hover: 'hover:bg-green-700',
    icon: Cross
  },
  rescue: {
    id: 'rescue',
    label: 'Rescue & Flood Response',
    short: 'Rescue',
    color: 'blue',
    hex: '#2563EB',
    darkHex: '#1D4ED8',
    softHex: '#EFF6FF',
    borderHex: '#93C5FD',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    bg: 'bg-blue-600',
    border: 'border-blue-600',
    hover: 'hover:bg-blue-700',
    icon: LifeBuoy
  }
};

export const EMAIL_PLACEHOLDER = 'dispatcher@city.gov.ph';
