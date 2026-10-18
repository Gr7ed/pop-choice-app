import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { LuChevronDown, LuHeart, LuListVideo, LuLogOut, LuMenu } from 'react-icons/lu';
import { authClient } from '../../lib/auth-client';
import { useSession } from '../../lib/useSession';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { primaryNav } from './nav';
import type { NavItem } from './nav';

const pillClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
    isActive
      ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
  );

const sheetLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors',
    isActive
      ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
  );

function initialsFor(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 1).toUpperCase();
}

/**
 * Sticky, blurred app header. Desktop shows inline NavLink pills; on small
 * screens the same links and account actions move into a slide-over Sheet.
 */
export default function SiteHeader(): ReactElement {
  const { user } = useSession();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.name || user?.email || '';
  const initials = initialsFor(displayName);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await authClient.signOut();
    navigate('/');
  };

  const authActions = (
    <>
      {user ? (
        <>
          <Button asChild variant="ghost" className="justify-start gap-3 text-base" onClick={() => setMenuOpen(false)}>
            <Link to="/favorites">
              <LuHeart className="size-5" aria-hidden="true" /> Favorites
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start gap-3 text-base" onClick={() => setMenuOpen(false)}>
            <Link to="/mylists">
              <LuListVideo className="size-5" aria-hidden="true" /> My Lists
            </Link>
          </Button>
          <Button variant="outline" className="justify-start gap-3 text-base" onClick={handleSignOut}>
            <LuLogOut className="size-5" aria-hidden="true" /> Sign out
          </Button>
        </>
      ) : (
        <>
          <Button asChild variant="ghost" className="justify-start text-base" onClick={() => setMenuOpen(false)}>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="justify-start text-base" onClick={() => setMenuOpen(false)}>
            <Link to="/signup">Sign up</Link>
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="PopChoice home"
          className="inline-flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <img
            src="/assets/popcorn-logo.png"
            alt=""
            width={40}
            height={40}
            className="size-9 object-contain drop-shadow-md sm:size-10"
          />
          <span className="font-heading text-xl leading-none tracking-tight text-foreground sm:text-2xl">
            Pop<span className="text-primary">Choice</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
          {primaryNav.map((item: NavItem) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={pillClass}>
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn('size-4 transition-transform group-hover:scale-110', isActive && 'text-primary')}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/15 font-heading text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-28 truncate">{displayName}</span>
                  <LuChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
                  {user.email && <span className="block truncate text-xs text-muted-foreground">{user.email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/favorites" className="cursor-pointer">
                    <LuHeart aria-hidden="true" /> Favorites
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/mylists" className="cursor-pointer">
                    <LuListVideo aria-hidden="true" /> My Lists
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
                  <LuLogOut aria-hidden="true" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="px-3.5">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="rounded-full px-4">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Open menu">
              <LuMenu className="size-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(19rem,85vw)] gap-6 p-5">
            <SheetHeader className="p-0">
              <SheetTitle className="font-heading text-lg">Menu</SheetTitle>
              <SheetDescription className="sr-only">Site navigation and account actions</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-1.5" aria-label="Mobile">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.end} className={sheetLinkClass} onClick={() => setMenuOpen(false)}>
                    <Icon className="size-5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-4">{authActions}</div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
