"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/shadcn-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "../../../convex/_generated/api";

type Enquiry = FunctionReturnType<typeof api.contacts.list>["page"][number];
type PaginationStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

const PAGE_SIZE = 15;

const listDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const listTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

const detailDateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isToday(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function formatListDate(timestamp: number) {
  const date = new Date(timestamp);
  return isToday(timestamp)
    ? listTimeFormatter.format(date)
    : listDateFormatter.format(date);
}

function EnquiriesListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="flex gap-3 border-b px-4 py-4 last:border-b-0"
          key={index}
        >
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EnquiryDetailSkeleton() {
  return (
    <div
      className="flex h-[28rem] flex-col gap-8 p-6 md:p-8 lg:h-[42rem] xl:h-[54rem]"
      aria-hidden="true"
    >
      <div className="flex items-start gap-4">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="flex flex-col gap-3 border-t pt-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function EnquiryListItem({
  enquiry,
  isSelected,
  onSelect,
}: {
  enquiry: Enquiry;
  isSelected: boolean;
  onSelect: (id: Id<"contacts">) => void;
}) {
  const secondary =
    enquiry.companyName || enquiry.email || enquiry.contactNumber;
  const preview =
    enquiry.description || enquiry.email || enquiry.contactNumber || "—";

  return (
    <button
      aria-selected={isSelected}
      className="flex w-full cursor-pointer gap-3 border-b px-4 py-4 text-left transition-colors duration-150 last:border-b-0 hover:bg-muted/70 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset motion-reduce:transition-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
      data-selected={isSelected}
      onClick={() => onSelect(enquiry._id)}
      role="option"
      type="button"
    >
      <Avatar className="size-9 shrink-0">
        <AvatarFallback>{getInitials(enquiry.name)}</AvatarFallback>
      </Avatar>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-semibold">{enquiry.name}</span>
          <time
            className="shrink-0 text-xs text-muted-foreground"
            dateTime={new Date(enquiry.submittedAt).toISOString()}
          >
            {formatListDate(enquiry.submittedAt)}
          </time>
        </span>
        {secondary ? (
          <span className="truncate text-xs font-medium">{secondary}</span>
        ) : null}
        <span className="truncate text-xs text-muted-foreground">{preview}</span>
      </span>
    </button>
  );
}

function CopyableContactValue({
  label,
  value,
}: {
  label: "email" | "phone";
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    },
    [],
  );

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        resetTimeoutRef.current = null;
      }, 1500);
    } catch {
      toast.error(`Could not copy ${label}.`);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        render={
          <button
            aria-label={`Copy ${label}: ${value}`}
            className="cursor-copy text-left underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={copyValue}
            type="button"
          />
        }
      >
        {value}
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : `Copy ${label}`}</TooltipContent>
    </Tooltip>
  );
}

function EnquiryDetail({ enquiry }: { enquiry: Enquiry }) {
  return (
    <article className="flex h-[28rem] flex-col p-6 md:p-8 lg:h-[42rem] xl:h-[54rem]">
      <header className="flex items-start gap-4">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback>{getInitials(enquiry.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="break-words font-heading text-xl font-semibold tracking-tight">
            {enquiry.name}
          </h2>
          <time
            className="mt-1 block text-sm text-muted-foreground"
            dateTime={new Date(enquiry.submittedAt).toISOString()}
          >
            {detailDateFormatter.format(new Date(enquiry.submittedAt))}
          </time>
        </div>
      </header>

      <dl className="mt-8 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[5rem_minmax(0,1fr)]">
        {enquiry.email ? (
          <>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="min-w-0 break-words">
              <CopyableContactValue label="email" value={enquiry.email} />
            </dd>
          </>
        ) : null}
        {enquiry.contactNumber ? (
          <>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="min-w-0 break-words">
              <CopyableContactValue
                label="phone"
                value={enquiry.contactNumber}
              />
            </dd>
          </>
        ) : null}
        {enquiry.companyName ? (
          <>
            <dt className="text-muted-foreground">Company</dt>
            <dd className="min-w-0 break-words">{enquiry.companyName}</dd>
          </>
        ) : null}
      </dl>

      <div className="mt-8 flex min-h-0 flex-1 flex-col border-t pt-6">
        <h3 className="text-sm font-medium">Description</h3>
        <ScrollArea className="mt-3 min-h-0 flex-1">
          <p className="max-w-[75ch] whitespace-pre-wrap break-words pr-4 pb-1 text-sm leading-6 text-foreground">
            {enquiry.description || "—"}
          </p>
        </ScrollArea>
      </div>
    </article>
  );
}

function LoadMoreTrigger({
  loadMore,
  status,
}: {
  loadMore: (numItems: number) => void;
  status: PaginationStatus;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || status !== "CanLoadMore") return;

    const root = trigger.closest('[data-slot="scroll-area-viewport"]');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore(PAGE_SIZE);
      },
      { root, rootMargin: "120px 0px" },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [loadMore, status]);

  return <div className="h-px" ref={triggerRef} aria-hidden="true" />;
}

function EnquiriesInboxView({
  enquiries,
  loadMore,
  onSearchChange,
  paginationStatus,
  search,
}: {
  enquiries: Enquiry[];
  loadMore: (numItems: number) => void;
  onSearchChange: (value: string) => void;
  paginationStatus: PaginationStatus;
  search: string;
}) {
  const [selectedId, setSelectedId] = useState<Id<"contacts"> | null>(null);
  const selectedEnquiry =
    enquiries.find((enquiry) => enquiry._id === selectedId) ?? enquiries[0];
  const isLoadingFirstPage = paginationStatus === "LoadingFirstPage";
  const hasMore = paginationStatus !== "Exhausted";

  return (
    <section className="flex flex-1 flex-col">
      <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
        Enquiries
      </h1>

      <div className="mt-5 grid min-h-0 rounded-lg border bg-background lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="min-w-0 border-b lg:border-r lg:border-b-0">
          <div className="flex h-13 items-center justify-between border-b px-4">
            <p className="text-sm font-semibold">Inbox</p>
            {!isLoadingFirstPage ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                {enquiries.length}
                {hasMore ? "+" : ""}
              </p>
            ) : null}
          </div>

          <div className="border-b p-2">
            <div className="relative">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search enquiries"
                className="pl-7"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search enquiries"
                type="search"
                value={search}
              />
            </div>
          </div>

          <ScrollArea className="h-[18rem] lg:h-[28rem] xl:h-[30rem]">
            <div aria-label="Enquiries" role="listbox">
              {isLoadingFirstPage ? (
                <EnquiriesListSkeleton />
              ) : enquiries.length > 0 ? (
                <>
                  {enquiries.map((enquiry) => (
                    <EnquiryListItem
                      enquiry={enquiry}
                      isSelected={selectedEnquiry?._id === enquiry._id}
                      key={enquiry._id}
                      onSelect={setSelectedId}
                    />
                  ))}
                  {paginationStatus === "LoadingMore" ? (
                    <EnquiriesListSkeleton rows={2} />
                  ) : null}
                  <LoadMoreTrigger loadMore={loadMore} status={paginationStatus} />
                </>
              ) : (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  {search.trim() ? "No matches." : "No enquiries."}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="min-w-0 bg-background lg:sticky lg:top-9 lg:self-start">
          {isLoadingFirstPage ? (
            <EnquiryDetailSkeleton />
          ) : selectedEnquiry ? (
            <EnquiryDetail enquiry={selectedEnquiry} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function EnquiriesInbox() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const nextSearch = search.trim();
    if (nextSearch === debouncedSearch) return;

    const timeout = window.setTimeout(() => {
      setDebouncedSearch(nextSearch);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [debouncedSearch, search]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.contacts.list,
    { search: debouncedSearch },
    { initialNumItems: PAGE_SIZE },
  );

  return (
    <EnquiriesInboxView
      enquiries={results}
      loadMore={loadMore}
      onSearchChange={setSearch}
      paginationStatus={status}
      search={search}
    />
  );
}
