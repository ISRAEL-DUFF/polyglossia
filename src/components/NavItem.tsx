
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon: Icon }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <Link href={href} legacyBehavior passHref>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={{ children: label, side: 'right', align: 'center' }}
          className={cn(
            "justify-start",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <a>
            <Icon className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">{label}</span>
          </a>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
};

export default NavItem;
