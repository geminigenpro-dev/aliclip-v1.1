import React from 'react';
import {
  Package,
  GraduationCap,
  Layers,
  History,
  CheckCircle2,
  CreditCard,
  Palette,
  FileText,
  BookOpen,
  Cloud,
  ShieldCheck,
  Sparkles,
  Crown,
  Zap,
  Bot,
  Film,
  Award,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Tv,
  FolderArchive,
  Headphones,
  Flame,
  Star,
  HelpCircle,
  Grid,
  Tag,
  Settings,
  Activity,
  CheckSquare,
  Boxes,
  Users,
  Smartphone,
  Wallet,
  Send,
  Receipt,
  LucideIcon,
} from 'lucide-react';

export const ADMIN_ICON_MAP: Record<string, LucideIcon> = {
  Package,
  GraduationCap,
  Layers,
  History,
  CheckCircle2,
  CreditCard,
  Palette,
  FileText,
  BookOpen,
  Cloud,
  ShieldCheck,
  Sparkles,
  Crown,
  Zap,
  Bot,
  Film,
  Award,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Tv,
  FolderArchive,
  Headphones,
  Flame,
  Star,
  HelpCircle,
  Grid,
  Tag,
  Settings,
  Activity,
  CheckSquare,
  Boxes,
  Users,
  Smartphone,
  Wallet,
  Send,
  Receipt,
};

export interface IconOption {
  id: string;
  label: string;
  category: 'gestión' | 'digital' | 'comercio' | 'soporte';
  icon: LucideIcon;
}

export const AVAILABLE_ADMIN_ICONS: IconOption[] = [
  { id: 'Receipt', label: 'Facturación & Boletas', category: 'comercio', icon: Receipt },
  { id: 'Package', label: 'Membresías / Caja', category: 'gestión', icon: Package },
  { id: 'GraduationCap', label: 'Cursos / Academia', category: 'digital', icon: GraduationCap },
  { id: 'Layers', label: 'Recursos / Packs', category: 'digital', icon: Layers },
  { id: 'History', label: 'Historial / Ventas', category: 'comercio', icon: History },
  { id: 'CheckCircle2', label: 'Confirmar Venta', category: 'comercio', icon: CheckCircle2 },
  { id: 'CreditCard', label: 'Pagos / Pasarelas', category: 'comercio', icon: CreditCard },
  { id: 'Palette', label: 'Marca / Estilo', category: 'gestión', icon: Palette },
  { id: 'FileText', label: 'Textos / Web', category: 'gestión', icon: FileText },
  { id: 'BookOpen', label: 'Libro Reclamaciones', category: 'soporte', icon: BookOpen },
  { id: 'Cloud', label: 'Nube / Base de Datos', category: 'gestión', icon: Cloud },
  { id: 'ShieldCheck', label: 'Seguridad / Claves', category: 'soporte', icon: ShieldCheck },
  { id: 'Sparkles', label: 'Inteligencia Artificial', category: 'digital', icon: Sparkles },
  { id: 'Bot', label: 'Bots & Automatización', category: 'digital', icon: Bot },
  { id: 'Film', label: 'Streaming & Series', category: 'digital', icon: Film },
  { id: 'Tv', label: 'Cuentas Pantallas / TV', category: 'digital', icon: Tv },
  { id: 'FolderArchive', label: 'Archivos & Drive', category: 'digital', icon: FolderArchive },
  { id: 'Crown', label: 'VIP / Exclusivo', category: 'comercio', icon: Crown },
  { id: 'Flame', label: 'Más Vendidos / Hot', category: 'comercio', icon: Flame },
  { id: 'Zap', label: 'Entrega Flash / Rayo', category: 'comercio', icon: Zap },
  { id: 'ShoppingBag', label: 'Bolsa de Compra', category: 'comercio', icon: ShoppingBag },
  { id: 'Award', label: 'Garantía / Calidad', category: 'soporte', icon: Award },
  { id: 'Star', label: 'Reseñas & Opiniones', category: 'soporte', icon: Star },
  { id: 'HelpCircle', label: 'Preguntas Frecuentes', category: 'soporte', icon: HelpCircle },
  { id: 'TrendingUp', label: 'Estadísticas Ventas', category: 'comercio', icon: TrendingUp },
  { id: 'Users', label: 'Clientes & Usuarios', category: 'soporte', icon: Users },
  { id: 'Settings', label: 'Configuraciones', category: 'gestión', icon: Settings },
];

export const getAdminIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return Package;
  return ADMIN_ICON_MAP[iconName] || Package;
};

interface AdminIconProps {
  name?: string;
  className?: string;
  fallback?: LucideIcon;
}

export const AdminIcon: React.FC<AdminIconProps> = ({
  name,
  className = 'w-4 h-4',
  fallback = Package,
}) => {
  const IconComponent = (name && ADMIN_ICON_MAP[name]) || fallback;
  return <IconComponent className={className} />;
};
