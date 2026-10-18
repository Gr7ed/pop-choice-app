import type { IconType } from 'react-icons';
import { LuCompass, LuHeart, LuHouse, LuListVideo } from 'react-icons/lu';

export interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  /** Only match the exact path — used so Home is not active on every route. */
  end?: boolean;
}

export const primaryNav: NavItem[] = [
  { to: '/', label: 'Home', icon: LuHouse, end: true },
  { to: '/discover', label: 'Discover', icon: LuCompass },
  { to: '/favorites', label: 'Favorites', icon: LuHeart },
  { to: '/mylists', label: 'My Lists', icon: LuListVideo },
];
