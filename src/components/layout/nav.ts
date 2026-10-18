import type { IconType } from 'react-icons';
import { LuHeart, LuHouse, LuListVideo } from 'react-icons/lu';

export interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  /** Only match the exact path — used so Home is not active on every route. */
  end?: boolean;
}

export const primaryNav: NavItem[] = [
  { to: '/', label: 'Home', icon: LuHouse, end: true },
  { to: '/favorites', label: 'Favorites', icon: LuHeart },
  { to: '/mylists', label: 'My Lists', icon: LuListVideo },
];
