import { LayoutDashboard, CalendarDays, Flag, Trophy, GitBranch, Medal, User as UserIcon, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/matches",     label: "Matches",     icon: CalendarDays },
  { href: "/teams",       label: "Teams",       icon: Flag },
  { href: "/standings",   label: "Standings",   icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/bracket",     label: "Bracket",     icon: GitBranch },
  { href: "/profile",     label: "Profile",     icon: UserIcon },
];

export const ADMIN_LINK: NavItem = { href: "/admin", label: "Admin", icon: Wrench };
