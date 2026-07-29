"use client";

import {
  CurrencyInrIcon,
  EnvelopeSimpleIcon,
  FolderOpenIcon,
  GaugeIcon,
  PackageIcon,
  ShieldWarningIcon,
  SidebarIcon,
  SlidersHorizontalIcon,
  TreeStructureIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

type NavigationSection = {
  items: NavigationItem[];
  label: string;
};

const navigation: NavigationSection[] = [
  {
    label: "Workspace",
    items: [{ title: "Overview", href: "/", icon: GaugeIcon }],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", href: "/products", icon: PackageIcon },
      { title: "Categories", href: "/categories", icon: FolderOpenIcon },
      {
        title: "Subcategories",
        href: "/subcategories",
        icon: TreeStructureIcon,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Metal prices",
        href: "/metal-prices",
        icon: CurrencyInrIcon,
      },
      {
        title: "Enquiries",
        href: "/enquiries",
        icon: EnvelopeSimpleIcon,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Site settings",
        href: "/site-settings",
        icon: SlidersHorizontalIcon,
      },
    ],
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
    return navigation[0].items[0];
  }

  return (
    navigation
      .flatMap((section) => section.items)
      .find((item) => item.href === `/${segment}`) ?? navigation[0].items[0]
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
                tooltip="Toggle Sidebar"
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
        {navigation.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
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
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="in-data-[mobile=true]:h-11"
              disabled
              tooltip="Authentication will be added in a later phase"
            >
              <ShieldWarningIcon />
              <span>Authentication pending</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
