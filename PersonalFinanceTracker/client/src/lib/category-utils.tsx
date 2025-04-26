import { 
  ShoppingCart, 
  Bus, 
  Film, 
  ShoppingBag, 
  Heart, 
  DollarSign,
  CirclePlus
} from 'lucide-react';
import React from 'react';

export type CategoryIconProps = {
  icon: React.ReactNode;
  color: string;
};

export function getCategoryIcon(category: string): CategoryIconProps {
  switch (category) {
    case 'Food':
      return {
        icon: <ShoppingCart className="h-6 w-6 text-white" />,
        color: '#3B82F6' // blue
      };
    case 'Transport':
      return {
        icon: <Bus className="h-6 w-6 text-white" />,
        color: '#8B5CF6' // purple
      };
    case 'Entertainment':
      return {
        icon: <Film className="h-6 w-6 text-white" />,
        color: '#EF4444' // red
      };
    case 'Shopping':
      return {
        icon: <ShoppingBag className="h-6 w-6 text-white" />,
        color: '#10B981' // green
      };
    case 'Health':
      return {
        icon: <Heart className="h-6 w-6 text-white" />,
        color: '#EC4899' // pink
      };
    case 'Bills':
      return {
        icon: <DollarSign className="h-6 w-6 text-white" />,
        color: '#F59E0B' // amber
      };
    case 'Other':
    default:
      return {
        icon: <CirclePlus className="h-6 w-6 text-white" />,
        color: '#6B7280' // gray
      };
  }
}

export function getCategoryColor(category: string): string {
  return getCategoryIcon(category).color;
}

export function getCategoryBadgeStyles(category: string): string {
  switch (category) {
    case 'Food':
      return 'bg-blue-100 text-blue-800';
    case 'Transport':
      return 'bg-purple-100 text-purple-800';
    case 'Entertainment':
      return 'bg-red-100 text-red-800';
    case 'Shopping':
      return 'bg-green-100 text-green-800';
    case 'Health':
      return 'bg-pink-100 text-pink-800';
    case 'Bills':
      return 'bg-yellow-100 text-yellow-800';
    case 'Other':
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
