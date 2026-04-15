import React from 'react';
import { 
  Tag, 
  Briefcase, 
  Heart, 
  BookOpen, 
  Coffee as CoffeeIcon, 
  Zap, 
  Target, 
  Brain, 
  Users, 
  Code, 
  Music, 
  Camera, 
  Layers 
} from 'lucide-react-native';

const icons: Record<string, any> = {
  'briefcase': Briefcase,
  'heart': Heart,
  'book-open': BookOpen,
  'coffee': CoffeeIcon,
  'zap': Zap,
  'target': Target,
  'brain': Brain,
  'tag': Tag,
  'users': Users,
  'code': Code,
  'music': Music,
  'camera': Camera,
  'layers': Layers,
};

export const CategoryIcon = ({ name, size, color }: { name: string, size: number, color: string }) => {
  const IconComponent = icons[name] || Tag;
  return <IconComponent size={size} color={color} />;
};
