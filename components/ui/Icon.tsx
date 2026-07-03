import { Ionicons } from '@expo/vector-icons';

type IconProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
