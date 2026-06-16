"use client";

import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  children: ReactNode;
};

export function Link({ to, children, ...props }: LinkProps) {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return (target: string | number) => {
    if (typeof target === "number") {
      if (target < 0) {
        router.back();
      }
      return;
    }

    router.push(target);
  };
}

export function useParams() {
  return useNextParams();
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const search = searchParams.toString();

  return {
    pathname,
    search: search ? `?${search}` : "",
  };
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string> | string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const readonlySearchParams = useNextSearchParams();
  const searchParams = new URLSearchParams(readonlySearchParams.toString());

  const setSearchParams = (next: URLSearchParams | Record<string, string> | string) => {
    const params = next instanceof URLSearchParams ? next : new URLSearchParams(next);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return [searchParams, setSearchParams];
}

export function Outlet() {
  return null;
}
