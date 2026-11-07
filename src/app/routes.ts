import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Users,
  Landmark,
  Rocket,
  HeartHandshake,
  Newspaper,
  Wallet,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { TabId } from '../store/uiStore';

export interface RouteConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  inMobileBar: boolean;
}

export const ROUTES: RouteConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, inMobileBar: true },
  { id: 'company', label: 'Company', icon: Building2, inMobileBar: true },
  { id: 'market', label: 'Market', icon: TrendingUp, inMobileBar: true },
  { id: 'people', label: 'People', icon: Users, inMobileBar: true },
  { id: 'wife', label: 'Wife', icon: HeartHandshake, inMobileBar: false },
  { id: 'institutions', label: 'Institutions', icon: Landmark, inMobileBar: false },
  { id: 'startups', label: 'Startups', icon: Rocket, inMobileBar: false },
  { id: 'news', label: 'News', icon: Newspaper, inMobileBar: false },
  { id: 'finance', label: 'Finance', icon: Wallet, inMobileBar: false },
  { id: 'settings', label: 'Settings', icon: Settings, inMobileBar: false },
];
