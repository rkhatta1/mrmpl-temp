"use client";

import {
  CurrencyInrIcon,
  EnvelopeSimpleIcon,
  FolderOpenIcon,
  GaugeIcon,
  PackageIcon,
  SidebarIcon,
  SlidersHorizontalIcon,
  TreeStructureIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

import { AdminNavUser } from "@/components/admin/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

type AdminShellProps = {
  basePath: string;
  children: ReactNode;
};

type NavigationItem = {
  href: string;
  icon: ComponentType;
  title: string;
};

const navigation: NavigationItem[] = [
  { title: "Overview", href: "/", icon: GaugeIcon },
  { title: "Products", href: "/products", icon: PackageIcon },
  { title: "Categories", href: "/categories", icon: FolderOpenIcon },
  {
    title: "Subcategories",
    href: "/subcategories",
    icon: TreeStructureIcon,
  },
  {
    title: "Metal prices",
    href: "/metal-prices",
    icon: CurrencyInrIcon,
  },
  { title: "Enquiries", href: "/enquiries", icon: EnvelopeSimpleIcon },
  {
    title: "Site settings",
    href: "/site-settings",
    icon: SlidersHorizontalIcon,
  },
];

function getHref(basePath: string, href: string) {
  if (href === "/") {
    return basePath || "/";
  }

  return `${basePath}${href}`;
}

function getCurrentSection(segment: string | null) {
  if (!segment) {
    return navigation[0];
  }

  return (
    navigation.find((item) => item.href === `/${segment}`) ?? navigation[0]
  );
}

function AdminEmblem() {
  return (
    <Image
      alt="MRMPL"
      height={16}
      priority
      src="/mrmpl-emblem-green.svg"
      width={16}
    />
  );
}

function AdminSidebar({
  basePath,
  activeHref,
}: {
  basePath: string;
  activeHref: string;
}) {
  const { isMobile, state, toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        {isMobile ? (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center justify-between">
              <SidebarMenuButton
                className="w-fit"
                render={<div aria-hidden="true" />}
              >
                <AdminEmblem />
              </SidebarMenuButton>
              <SidebarTrigger size="icon-lg" />
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                aria-expanded={state === "expanded"}
                aria-label="Toggle Sidebar"
                className="w-fit"
                onClick={toggleSidebar}
              >
                <span className="relative size-4 shrink-0">
                  <span className="absolute inset-0 transition-opacity duration-150 ease-out motion-reduce:transition-none group-hover/menu-button:opacity-0">
                    <AdminEmblem />
                  </span>
                  <SidebarIcon className="absolute inset-0 opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none group-hover/menu-button:opacity-100" />
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className="in-data-[mobile=true]:h-11"
                    isActive={activeHref === item.href}
                    render={<Link href={getHref(basePath, item.href)} />}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <AdminNavUser basePath={basePath} />
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminShell({ basePath, children }: AdminShellProps) {
  const segment = useSelectedLayoutSegment();
  const activeHref = getCurrentSection(segment).href;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AdminSidebar
          activeHref={activeHref}
          basePath={basePath}
        />
        <SidebarInset>
          <SidebarTrigger className="fixed top-3 left-3 z-30 size-11 bg-background/90 shadow-sm ring-1 ring-border backdrop-blur md:hidden" />
          <div className="flex flex-1 flex-col p-5 pt-20 md:p-7 lg:p-9">
            <div className="mx-auto flex w-full max-w-5xl xl:max-w-[92rem] flex-1 flex-col">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
