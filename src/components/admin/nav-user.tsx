"use client";

import { CaretUpDownIcon, SignOutIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

type AdminNavUserProps = {
  basePath: string;
};

function getInitials(name: string, email: string) {
  const fromName = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (fromName) {
    return fromName;
  }

  return email.slice(0, 2).toUpperCase() || "AD";
}

export function AdminNavUser({ basePath }: AdminNavUserProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const user = useQuery(api.auth.getCurrentUser);
  const [signingOut, setSigningOut] = useState(false);
  const lastUserRef = useRef<NonNullable<typeof user> | null>(null);

  useEffect(() => {
    if (user) {
      lastUserRef.current = user;
    }
  }, [user]);

  // Signing out clears the session before the shell finishes sliding away, so
  // fall back to the last known user to keep the departing pane intact.
  const displayUser = signingOut ? (user ?? lastUserRef.current) : user;

  const loginPath = basePath ? `${basePath}/login` : "/login";

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      await authClient.signOut();
      // No router.refresh(): the session cookie is already gone, so refreshing
      // this route makes the proxy answer with a redirect, which Next turns
      // into a full document navigation and kills the slide-up transition.
      router.replace(loginPath);
    } catch {
      setSigningOut(false);
    }
  }

  if (displayUser === undefined) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="pointer-events-none">
            <Skeleton className="size-8 rounded-full" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (displayUser === null) {
    return null;
  }

  const name = displayUser.name?.trim() || "Admin";
  const email = displayUser.email?.trim() || "";
  const initials = getInitials(name, email);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="aria-expanded:bg-muted data-[state=open]:bg-muted"
                tooltip={name}
              />
            }
          >
            <Avatar className="after:border-sidebar-border">
              {displayUser.image ? (
                <AvatarImage src={displayUser.image} alt={name} />
              ) : null}
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
            <CaretUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    {displayUser.image ? (
                      <AvatarImage src={displayUser.image} alt={name} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={signingOut}
              onClick={() => {
                void handleSignOut();
              }}
            >
              <SignOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
