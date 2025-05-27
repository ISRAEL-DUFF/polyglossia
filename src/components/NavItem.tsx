
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import React from 'react'; // Import React for useState and useEffect

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon: Icon }) => {
  const pathname = usePathname();
  // Initialize isClientActive to false to match server render
  const [isClientActive, setIsClientActive] = React.useState(false);

  React.useEffect(() => {
    // Set the correct active state after hydration on the client
    setIsClientActive(pathname === href);
  }, [pathname, href]);

  return (
    <SidebarMenuItem>
      <Link href={href} legacyBehavior passHref>
        <SidebarMenuButton
          asChild
          isActive={isClientActive} // Use client-side determined active state
          tooltip={{ children: label, side: 'right', align: 'center' }}
          className={cn(
            "justify-start",
            // Apply active styles based on isClientActive.
            // Server will render without these active classes.
            // Client will initially render without them, then update after useEffect.
            isClientActive && "bg-sidebar-accent text-sidebar-accent-foreground"
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
