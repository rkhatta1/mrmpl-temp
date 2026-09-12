"use client";

import {
  CircleNotchIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import {
  useConvex,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AdminCatalogSummary } from "@/lib/admin-catalog";
import {
  hashBulkProductPhotoFile,
  parseBulkProductPhotoCustomId,
} from "@/lib/bulk-product-photo-contract";
import {
  photoCodeFromFileName,
  type BulkProductIssue,
  type BulkProductParseResult,
} from "@/lib/bulk-product-upload";
import {
  catalogImportIssues,
  downloadBulkProductWorkbook,
  generateBulkProductErrorWorkbook,
  generateBulkProductWorkbook,
  parseBulkProductWorkbook,
} from "@/lib/bulk-product-workbook";
import {
  mapImportPhotos,
  uploadBulkProductFiles,
  validateImportPhoto,
} from "@/lib/bulk-product-import-client";
import { optimizeBulkProductPhotoVariants } from "@/lib/product-image-optimizer";

const CONTROL = "min-h-11 min-w-11 sm:min-h-10 sm:min-w-10";
const PAGE_SIZE = 25;
const message = (error: unknown) =>
  error instanceof ConvexError && typeof error.data === "string"
    ? error.data
    : error instanceof Error
      ? error.message
      : "The request failed. Try again.";
const chunks = <Value,>(values: Value[], size: number) =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );

function Pagination({
  page,
  count,
  onPage,
}: {
  page: number;
  count: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="tabular-nums">
        {count ? page * PAGE_SIZE + 1 : 0}–
        {Math.min((page + 1) * PAGE_SIZE, count)} of {count}
      </span>
      <div className="flex gap-2">
        <Button
          className={CONTROL}
          variant="outline"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          className={CONTROL}
          variant="outline"
          disabled={(page + 1) * PAGE_SIZE >= count}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function IssueList({ issues }: { issues: BulkProductIssue[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const filtered = issues.filter((issue) =>
    `${issue.sheet} ${issue.row} ${issue.partCode ?? ""} ${issue.column ?? ""} ${issue.message}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1),
  );
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="import-issue-search">Filter issues</FieldLabel>
        <Input
          id="import-issue-search"
          className={CONTROL}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Part code, row, field or message"
        />
      </Field>
      <div
        className="max-h-56 overflow-auto rounded-md border"
        tabIndex={0}
        role="region"
        aria-label="Workbook issues"
      >
        <ul className="divide-y">
          {filtered
            .slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
            .map((issue, index) => (
              <li
                className="flex flex-col gap-1 p-3 break-words"
                key={`${issue.sheet}-${issue.row}-${issue.column}-${index}`}
              >
                <strong>
                  {issue.sheet ?? "Products"}
                  {issue.row > 0 ? ` · row ${issue.row}` : ""}
                  {issue.partCode ? ` · ${issue.partCode}` : ""}
                  {issue.column ? ` · ${issue.column}` : ""}
                </strong>
                <span>{issue.message}</span>
              </li>
            ))}
        </ul>
        {!filtered.length && <p className="p-3">No matching issues.</p>}
      </div>
      <Pagination page={current} count={filtered.length} onPage={setPage} />
    </div>
  );
}

function RowResults({ jobExternalId }: { jobExternalId: string }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.catalogImport.listRowResults,
    { jobExternalId },
    { initialNumItems: 100 },
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("unfinished");
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (status === "CanLoadMore") loadMore(100);
  }, [status, loadMore]);
  const filtered = results.filter(
    (row) =>
      (filter === "all" || row.status !== "completed") &&
      `${row.rowNumber} ${row.partCode} ${row.productName} ${row.message ?? ""}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  const current = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1),
  );
  return (
    <section className="flex flex-col gap-3" aria-label="Server row results">
      <h3 className="font-medium">Product results</h3>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="result-search">Filter results</FieldLabel>
          <Input
            id="result-search"
            className={CONTROL}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Part code, name, row or message"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="result-filter">Show results</FieldLabel>
          <select
            id="result-filter"
            className="min-h-11 rounded-md border bg-background px-3 sm:min-h-10"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="unfinished">Unfinished rows</option>
            <option value="all">All rows</option>
          </select>
        </Field>
      </FieldGroup>
      <p role="status" className="text-muted-foreground">
        {status === "Exhausted"
          ? `${results.length} row results loaded.`
          : "Loading complete row results…"}
      </p>
      <div
        className="max-h-64 overflow-auto rounded-md border"
        role="region"
        tabIndex={0}
        aria-label="Product row results"
      >
        <ul className="divide-y">
          {filtered
            .slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
            .map((row) => (
              <li
                key={row.rowNumber}
                className="flex flex-col gap-1 p-3 break-words"
              >
                <strong>
                  Products · row {row.rowNumber} · {row.partCode}
                </strong>
                <span>
                  {row.productName} · {row.status}
                </span>
                <span>
                  {row.message ??
                    (row.status === "pending"
                      ? "Not created yet."
                      : row.status === "completed"
                        ? "Product created."
                        : "Product was not created.")}
                </span>
              </li>
            ))}
        </ul>
        {!filtered.length && (
          <p className="p-3">
            {status === "Exhausted" ? "No matching rows." : "Loading rows…"}
          </p>
        )}
      </div>
      <Pagination page={current} count={filtered.length} onPage={setPage} />
    </section>
  );
}

export function BulkProductUploadDialog({
  catalog,
}: {
  catalog: AdminCatalogSummary | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [workbookName, setWorkbookName] = useState("");
  const [parsed, setParsed] = useState<BulkProductParseResult>();
  const [photos, setPhotos] = useState(new Map<string, File>());
  const [photoIssues, setPhotoIssues] = useState<BulkProductIssue[]>([]);
  const [reading, setReading] = useState(false);
  const [checkingPhotos, setCheckingPhotos] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
  const [error, setError] = useState("");
  const [jobExternalId, setJobExternalId] = useState<string>();
  const [clientBusy, setClientBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [closeWarning, setCloseWarning] = useState(false);
  const [query, setQuery] = useState("");
  const [rowFilter, setRowFilter] = useState("all");
  const [page, setPage] = useState(0);
  const workbookInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);
  const selection = useRef({ workbook: 0, photos: 0 });
  const photoCheck = useRef<AbortController | null>(null);
  const attempt = useRef<{
    controller: AbortController;
    jobExternalId?: string;
  } | null>(null);
  const convex = useConvex();
  const createJob = useMutation(api.catalogImport.createJob);
  const stageRows = useMutation(api.catalogImport.stageRows);
  const resolvePhotos = useMutation(api.catalogImport.resolvePhotos);
  const registerPhotos = useMutation(api.catalogImport.registerUploadedPhotos);
  const startImport = useMutation(api.catalogImport.startImport);
  const retryImport = useMutation(api.catalogImport.retryImport);
  const cancelImport = useMutation(api.catalogImport.cancelImport);
  const job = useQuery(
    api.catalogImport.getJob,
    jobExternalId ? { jobExternalId } : "skip",
  );
  const serverBusy =
    job?.status === "validating" ||
    job?.status === "importing" ||
    job?.status === "retrying";
  const frozen = clientBusy || actionBusy || Boolean(jobExternalId);

  useEffect(() => {
    if (!clientBusy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [clientBusy]);
  useEffect(
    () => () => {
      attempt.current?.controller.abort();
      photoCheck.current?.abort();
      selection.current.workbook++;
      selection.current.photos++;
    },
    [],
  );

  const requiredCodes = useMemo(
    () => [...new Set(parsed?.rows.flatMap((row) => row.photoCodes) ?? [])],
    [parsed],
  );
  const issues = useMemo(() => {
    const missing = requiredCodes.filter((code) => !photos.has(code));
    return [
      ...(parsed?.issues ?? []),
      ...photoIssues,
      ...(parsed && catalog && !jobExternalId
        ? catalogImportIssues(parsed.rows, catalog)
        : []),
      ...missing.map((code): BulkProductIssue => ({
        sheet: "Photos",
        row: 0,
        column: "photo_codes",
        message: `Select a photo named ${code}.jpg, .png, .webp or .avif.`,
      })),
    ];
  }, [parsed, photoIssues, requiredCodes, photos, catalog, jobExternalId]);
  const unused = [...photos.keys()].filter(
    (code) => !requiredCodes.includes(code),
  );
  const ready =
    Boolean(parsed?.rows.length && catalog) &&
    !issues.length &&
    !reading &&
    !checkingPhotos &&
    !frozen;
  const filteredRows = useMemo(() => {
    const issueRows = new Set(
      issues
        .filter((issue) => issue.sheet === "Products")
        .map((issue) => issue.row),
    );
    const issueCodes = new Set(
      issues.map((issue) => issue.partCode).filter(Boolean),
    );
    const search = query.toLocaleLowerCase();
    return (parsed?.rows ?? []).filter(
      (row) =>
        (rowFilter === "all" ||
          issueRows.has(row.rowNumber) ||
          issueCodes.has(row.partCode)) &&
        (!search || JSON.stringify(row).toLocaleLowerCase().includes(search)),
    );
  }, [parsed, issues, rowFilter, query]);
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filteredRows.length / PAGE_SIZE) - 1),
  );

  async function chooseWorkbook(file?: File) {
    if (!file || frozen || !catalog) return;
    const version = ++selection.current.workbook;
    setReading(true);
    setWorkbookName(file.name);
    setParsed(undefined);
    setError("");
    setPage(0);
    try {
      if (!file.name.toLocaleLowerCase().endsWith(".xlsx"))
        throw new Error("Choose the official .xlsx workbook.");
      if (!file.size || file.size > 10 * 1024 * 1024)
        throw new Error("Choose a nonempty workbook of at most 10 MiB.");
      const result = await parseBulkProductWorkbook(
        await file.arrayBuffer(),
        catalog,
      );
      if (version === selection.current.workbook) {
        // Live catalog checks are recomputed below as catalog subscriptions change.
        const catalogIssues = catalogImportIssues(result.rows, catalog);
        setParsed({
          ...result,
          issues: result.issues.filter(
            (issue) =>
              !catalogIssues.some(
                (current) =>
                  current.row === issue.row &&
                  current.message === issue.message,
              ),
          ),
        });
      }
    } catch (cause) {
      if (version === selection.current.workbook) setError(message(cause));
    } finally {
      if (version === selection.current.workbook) setReading(false);
    }
  }

  async function choosePhotos(files: FileList | null) {
    if (!files || frozen) return;
    const version = ++selection.current.photos;
    photoCheck.current?.abort();
    const controller = new AbortController();
    photoCheck.current = controller;
    setCheckingPhotos(true);
    setPhotos(new Map());
    setPhotoIssues([]);
    setError("");
    try {
      const selected = Array.from(files);
      if (selected.length > 3000)
        throw new Error("Select at most 3,000 photo files.");
      const checked = await mapImportPhotos(
        selected,
        controller.signal,
        async (file) => {
          const code = photoCodeFromFileName(file.name);
          try {
            if (!code)
              throw new Error(
                "Filename must be a photo code using letters, numbers, hyphens or underscores.",
              );
            await validateImportPhoto(file);
            return { file, code, issue: null };
          } catch (cause) {
            return { file, code, issue: `${file.name}: ${message(cause)}` };
          }
        },
      );
      const next = new Map<string, File>();
      const nextIssues: BulkProductIssue[] = [];
      for (const item of checked) {
        const problem =
          item.issue ??
          (item.code && next.has(item.code)
            ? `${item.file.name}: another selected file uses photo code ${item.code}.`
            : null);
        if (problem)
          nextIssues.push({ sheet: "Photos", row: 0, message: problem });
        else if (item.code) next.set(item.code, item.file);
      }
      if (version === selection.current.photos) {
        setPhotos(next);
        setPhotoIssues(nextIssues);
      }
    } catch (cause) {
      if (version === selection.current.photos)
        setPhotoIssues([{ sheet: "Photos", row: 0, message: message(cause) }]);
    } finally {
      if (version === selection.current.photos) setCheckingPhotos(false);
    }
  }

  async function download(kind: "template" | "errors") {
    setDownloadPending(true);
    try {
      if (kind === "template") {
        if (!catalog) throw new Error("Wait for the current catalog to load.");
        const examples = await Promise.all(
          [...catalog.products]
            .sort((a, b) => a.partCode.localeCompare(b.partCode))
            .slice(0, 3)
            .map((product) =>
              convex.query(api.catalogAdmin.getProduct, {
                externalId: product.externalId,
              }),
            ),
        );
        downloadBulkProductWorkbook(
          await generateBulkProductWorkbook(
            catalog,
            examples.filter((product) => product !== null),
          ),
          "mrmpl-product-import.xlsx",
        );
      } else {
        const report = [...issues];
        if (jobExternalId) {
          let cursor: string | null = null;
          while (true) {
            const result: FunctionReturnType<
              typeof api.catalogImport.listRowResults
            > = await convex.query(api.catalogImport.listRowResults, {
              jobExternalId,
              paginationOpts: { cursor, numItems: 100 },
            });
            report.push(
              ...result.page
                .filter((row) => row.status !== "completed")
                .map((row) => ({
                  sheet: "Products",
                  row: row.rowNumber,
                  partCode: row.partCode,
                  message: row.message ?? `${row.status}: product not created.`,
                })),
            );
            if (result.isDone) break;
            cursor = result.continueCursor;
          }
          if (job?.failureMessage)
            report.unshift({
              sheet: "Import",
              row: 0,
              message: job.failureMessage,
            });
        }
        if (error) report.unshift({ sheet: "Import", row: 0, message: error });
        downloadBulkProductWorkbook(
          await generateBulkProductErrorWorkbook(report),
          "mrmpl-import-errors.xlsx",
        );
      }
    } catch (cause) {
      setError(message(cause));
    } finally {
      setDownloadPending(false);
    }
  }

  async function runImport() {
    if (!ready || !parsed || attempt.current) return;
    const active = {
      controller: new AbortController(),
      jobExternalId: undefined as string | undefined,
    };
    attempt.current = active;
    const { signal } = active.controller;
    let startRequested = false;
    setClientBusy(true);
    setCancelRequested(false);
    setError("");
    setCloseWarning(false);
    setPhase("Preparing import");
    setProgress({ done: 0, total: 0 });
    try {
      const created = await createJob({
        workbookName,
        expectedRowCount: parsed.rows.length,
        expectedPhotoCount: requiredCodes.length,
      });
      active.jobExternalId = created.externalId;
      setJobExternalId(created.externalId);
      signal.throwIfAborted();
      setPhase("Staging products");
      setProgress({ done: 0, total: parsed.rows.length });
      let staged = 0;
      for (const batch of chunks(parsed.rows, 50)) {
        signal.throwIfAborted();
        await stageRows({ jobExternalId: created.externalId, rows: batch });
        staged += batch.length;
        setProgress({ done: staged, total: parsed.rows.length });
      }
      setPhase("Checking photo contents");
      setProgress({ done: 0, total: requiredCodes.length });
      let hashed = 0;
      const hashedPhotos = await mapImportPhotos(
        requiredCodes,
        signal,
        async (code) => {
          const file = photos.get(code)!;
          const contentHash = await hashBulkProductPhotoFile(file);
          signal.throwIfAborted();
          setProgress({ done: ++hashed, total: requiredCodes.length });
          return { code, file, contentHash, sourceName: file.name };
        },
      );
      const filesByHash = new Map(
        hashedPhotos.map((photo) => [photo.contentHash, photo.file]),
      );
      const uploads = new Set<string>();
      setPhase("Resolving reusable photos");
      setProgress({ done: 0, total: requiredCodes.length });
      let resolved = 0;
      for (const batch of chunks(hashedPhotos, 100)) {
        signal.throwIfAborted();
        const result = await resolvePhotos({
          jobExternalId: created.externalId,
          photos: batch.map(({ code, contentHash, sourceName }) => ({
            code,
            contentHash,
            sourceName,
          })),
        });
        for (const upload of result.uploads) uploads.add(upload.contentHash);
        resolved += batch.length;
        setProgress({ done: resolved, total: requiredCodes.length });
      }
      setPhase("Preparing and uploading images");
      setProgress({ done: 0, total: uploads.size });
      let registered = 0;
      await mapImportPhotos([...uploads], signal, async (contentHash) => {
        const variants = await optimizeBulkProductPhotoVariants(
          filesByHash.get(contentHash)!,
          { contentHash, jobExternalId: created.externalId },
        );
        signal.throwIfAborted();
        const uploaded = await uploadBulkProductFiles("bulkProductPhoto", {
          files: variants.map((variant) => variant.file),
          signal,
        });
        signal.throwIfAborted();
        const photoVariants = uploaded.map((item) => {
          const data = item.serverData;
          const identity = data && parseBulkProductPhotoCustomId(data.customId);
          if (
            !data ||
            !identity ||
            identity.contentHash !== contentHash ||
            identity.jobExternalId !== created.externalId
          )
            throw new Error("The uploaded photo set could not be verified.");
          return {
            customId: identity.customId,
            fileKey: data.fileKey,
            size: data.size,
            url: data.url,
            width: identity.width,
          };
        });
        const canonicalUrl = photoVariants.find(
          (variant) => variant.width === 1080,
        )?.url;
        if (photoVariants.length !== 4 || !canonicalUrl)
          throw new Error("A responsive photo set is incomplete.");
        await registerPhotos({
          jobExternalId: created.externalId,
          assets: [{ contentHash, canonicalUrl, variants: photoVariants }],
        });
        signal.throwIfAborted();
        setProgress({ done: ++registered, total: uploads.size });
      });
      signal.throwIfAborted();
      setPhase("Starting server validation");
      setProgress({ done: 0, total: 0 });
      startRequested = true;
      await startImport({ jobExternalId: created.externalId });
    } catch (cause) {
      const canceled = signal.aborted;
      let cleanupError = "";
      if (active.jobExternalId && (!startRequested || canceled)) {
        try {
          await cancelImport({ jobExternalId: active.jobExternalId });
        } catch (cleanup) {
          cleanupError = ` Cancellation could not be confirmed: ${message(cleanup)}. Use Cancel again before a new attempt.`;
        }
      }
      setError(
        (canceled
          ? "Upload attempt canceled. Start a new attempt to select files again."
          : startRequested
            ? `Could not confirm server start: ${message(cause)}. Check the job status below before restarting.`
            : `${message(cause)} Start a new attempt; interrupted uploads cannot resume.`) +
          cleanupError,
      );
    } finally {
      attempt.current = null;
      setClientBusy(false);
      setCancelRequested(false);
      setPhase("");
      setProgress({ done: 0, total: 0 });
      setCloseWarning(false);
    }
  }

  async function cancel() {
    setCancelRequested(true);
    setError("");
    attempt.current?.controller.abort();
    const id = attempt.current?.jobExternalId ?? jobExternalId;
    if (!id) return;
    setActionBusy(true);
    try {
      await cancelImport({ jobExternalId: id });
    } catch (cause) {
      setError(
        `Cancellation could not be confirmed: ${message(cause)}. Try Cancel again.`,
      );
    } finally {
      setActionBusy(false);
      setCancelRequested(false);
    }
  }

  async function freshAttempt() {
    if (clientBusy || actionBusy || serverBusy) return;
    setActionBusy(true);
    setError("");
    try {
      if (jobExternalId) await cancelImport({ jobExternalId });
      selection.current.workbook++;
      selection.current.photos++;
      photoCheck.current?.abort();
      setWorkbookName("");
      setParsed(undefined);
      setPhotos(new Map());
      setPhotoIssues([]);
      setJobExternalId(undefined);
      setReading(false);
      setCheckingPhotos(false);
      setPhase("");
      setProgress({ done: 0, total: 0 });
      setQuery("");
      setRowFilter("all");
      setPage(0);
      setCloseWarning(false);
    } catch (cause) {
      setError(
        `Cannot start a fresh attempt until cancellation succeeds: ${message(cause)}`,
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function retry() {
    if (!jobExternalId) return;
    setActionBusy(true);
    setError("");
    try {
      await retryImport({ jobExternalId });
    } catch (cause) {
      setError(message(cause));
    } finally {
      setActionBusy(false);
    }
  }

  function changeOpen(next: boolean) {
    if (!next && (clientBusy || actionBusy)) {
      setCloseWarning(true);
      return;
    }
    setCloseWarning(false);
    setOpen(next);
  }

  return (
    <>
      <Button
        className={CONTROL}
        disabled={!catalog}
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <UploadSimpleIcon data-icon="inline-start" />
        Bulk upload
      </Button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="motion-reduce:animate-none motion-reduce:duration-0"
          className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 motion-reduce:animate-none motion-reduce:duration-0 sm:max-w-4xl"
        >
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>Bulk product upload</DialogTitle>
            <DialogDescription>
              Create new products from the official workbook. Existing part
              codes block import.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-col gap-5 overflow-y-auto overscroll-contain p-5">
            <p className="text-muted-foreground">
              Keep this tab open through image preparation and uploads. After
              server processing starts, you can close this dialog. Products
              already created remain if later rows fail or you cancel.
            </p>
            {jobExternalId && (
              <p className="break-words font-medium">
                {workbookName} · {parsed?.rows.length ?? 0} product
                {parsed?.rows.length === 1 ? "" : "s"} · {requiredCodes.length}{" "}
                photo code{requiredCodes.length === 1 ? "" : "s"}
              </p>
            )}
            <div className={jobExternalId ? "hidden" : "grid gap-4 md:grid-cols-2"}>
              <Card>
                <CardHeader>
                  <CardTitle>1. Product workbook</CardTitle>
                  <CardDescription>
                    Download a template with current category references. New
                    categories and subcategories are allowed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <Button
                        className={CONTROL}
                        variant="outline"
                        disabled={frozen || downloadPending || !catalog}
                        onClick={() => void download("template")}
                      >
                        <DownloadSimpleIcon data-icon="inline-start" />
                        {downloadPending
                          ? "Preparing download…"
                          : "Download template"}
                      </Button>
                    </Field>
                    <Field>
                      <input
                        ref={workbookInput}
                        hidden
                        tabIndex={-1}
                        aria-label="Workbook file"
                        type="file"
                        accept=".xlsx"
                        disabled={frozen}
                        onChange={(event) => {
                          void chooseWorkbook(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                      <Button
                        className={CONTROL}
                        variant="outline"
                        disabled={frozen}
                        onClick={() => workbookInput.current?.click()}
                      >
                        <UploadSimpleIcon data-icon="inline-start" />
                        {reading ? "Reading workbook…" : "Choose workbook"}
                      </Button>
                      <FieldDescription className="break-all">
                        {workbookName ||
                          ".xlsx · up to 3,000 products · 10 MiB"}
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>
                    2. Photos{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </CardTitle>
                  <CardDescription>
                    List photo codes in display order, one per line. PHOTO-A
                    matches PHOTO-A.jpg. Reused codes require identical source
                    files.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <input
                        ref={photosInput}
                        hidden
                        tabIndex={-1}
                        aria-label="Photo files"
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        disabled={frozen}
                        onChange={(event) => {
                          void choosePhotos(event.target.files);
                          event.target.value = "";
                        }}
                      />
                      <Button
                        className={CONTROL}
                        variant="outline"
                        disabled={frozen}
                        onClick={() => photosInput.current?.click()}
                      >
                        <UploadSimpleIcon data-icon="inline-start" />
                        {checkingPhotos ? "Checking images…" : "Choose photos"}
                      </Button>
                      <FieldDescription>
                        {photos.size
                          ? `${photos.size} photos selected · ${(Array.from(photos.values()).reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MiB`
                          : "PNG, JPEG, WebP or AVIF · up to 25 MiB each"}
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </div>
            <div role="status" aria-live="polite" aria-atomic="true">
              {reading ? (
                "Reading and validating workbook…"
              ) : checkingPhotos ? (
                "Checking image files…"
              ) : clientBusy ? (
                <span className="flex items-center gap-2">
                  <CircleNotchIcon className="motion-safe:animate-spin" />
                  {phase}
                  {progress.total
                    ? ` · ${progress.done} of ${progress.total}`
                    : "…"}
                </span>
              ) : actionBusy ? (
                "Updating import…"
              ) : parsed && !jobExternalId ? (
                `${parsed.rows.length} products · ${issues.length} blocking issues · ${unused.length} warnings`
              ) : (
                ""
              )}
            </div>
            {error && <FieldError>{error}</FieldError>}
            {parsed && !jobExternalId && (
              <>
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Products", parsed.rows.length],
                    ["Photo codes", requiredCodes.length],
                    ["Blocking issues", issues.length],
                    ["Warnings", unused.length],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border p-3">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {unused.length > 0 && (
                  <details className="rounded-md border p-3">
                    <summary className="min-h-11 cursor-pointer font-medium sm:min-h-10">
                      Warnings · {unused.length} unused photos
                    </summary>
                    <p className="max-h-32 overflow-auto break-words">
                      These files will not upload: {unused.join(", ")}
                    </p>
                  </details>
                )}
                <section
                  className="flex flex-col gap-3"
                  aria-label="Product preview"
                >
                  <h3 className="font-medium">Review products</h3>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="preview-search">
                        Filter products
                      </FieldLabel>
                      <Input
                        id="preview-search"
                        className={CONTROL}
                        placeholder="Part code, product name or any field"
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setPage(0);
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="preview-filter">
                        Show products
                      </FieldLabel>
                      <select
                        id="preview-filter"
                        className="min-h-11 rounded-md border bg-background px-3 sm:min-h-10"
                        value={rowFilter}
                        onChange={(event) => {
                          setRowFilter(event.target.value);
                          setPage(0);
                        }}
                      >
                        <option value="all">All products</option>
                        <option value="issues">Products with row issues</option>
                      </select>
                    </Field>
                  </FieldGroup>
                  <div
                    className="max-h-72 overflow-auto rounded-md border"
                    tabIndex={0}
                    role="region"
                    aria-label="All product fields"
                  >
                    <ul className="divide-y">
                      {filteredRows
                        .slice(
                          currentPage * PAGE_SIZE,
                          (currentPage + 1) * PAGE_SIZE,
                        )
                        .map((row) => (
                          <li key={row.rowNumber}>
                            <details className="p-3">
                              <summary className="min-h-11 cursor-pointer break-words sm:min-h-10">
                                Row {row.rowNumber} ·{" "}
                                <strong>
                                  {row.partCode || "Missing part code"}
                                </strong>{" "}
                                · {row.productName || "Missing name"}
                              </summary>
                              <dl className="grid gap-2 py-2">
                                {Object.entries(row)
                                  .filter(([key]) => key !== "rowNumber")
                                  .map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="grid min-w-0 gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]"
                                    >
                                      <dt className="text-muted-foreground">
                                        {key
                                          .replace(/([A-Z])/g, " $1")
                                          .toLocaleLowerCase()}
                                      </dt>
                                      <dd className="whitespace-pre-wrap break-words">
                                        {Array.isArray(value)
                                          ? value
                                              .map((item) =>
                                                typeof item === "string"
                                                  ? item
                                                  : `${item.parameter}: ${item.value}${item.notes ? ` (${item.notes})` : ""}`,
                                              )
                                              .join("\n") || "—"
                                          : typeof value === "boolean"
                                            ? value
                                              ? "Published"
                                              : "Unpublished"
                                            : value || "—"}
                                      </dd>
                                    </div>
                                  ))}
                              </dl>
                            </details>
                          </li>
                        ))}
                    </ul>
                    {!filteredRows.length && (
                      <p className="p-3">No matching products.</p>
                    )}
                  </div>
                  <Pagination
                    page={currentPage}
                    count={filteredRows.length}
                    onPage={setPage}
                  />
                </section>
              </>
            )}
            {issues.length > 0 && !jobExternalId && (
              <section
                className="flex flex-col gap-3"
                aria-label="Blocking issues"
              >
                <h3 className="font-medium">
                  Resolve before import{" "}
                  <Badge variant="destructive">{issues.length}</Badge>
                </h3>
                <IssueList issues={issues} />
              </section>
            )}
            {ready && (
              <p className="font-medium">
                Ready to create {parsed?.rows.length} products. Review every row
                before confirming. The server checks conflicts and capacity
                again.
              </p>
            )}
            {jobExternalId && !job && (
              <p role="status">Loading import status…</p>
            )}
            {job && (
              <section
                className="flex flex-col gap-3 rounded-md border p-4"
                aria-label="Import progress"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">
                    {job.status === "completed"
                      ? "Import complete"
                      : "Import progress"}
                  </h3>
                  <Badge>{job.status}</Badge>
                </div>
                <p role="status" className="tabular-nums">
                  {job.createdProductCount} created · {job.errorCount} failed ·{" "}
                  {Math.max(
                    0,
                    job.expectedRowCount -
                      job.createdProductCount -
                      job.errorCount,
                  )}{" "}
                  unfinished · {job.expectedRowCount} total
                </p>
                <p className="text-muted-foreground">
                  {serverBusy
                    ? "Server processing continues independently. You can close this dialog and reopen it on this page."
                    : job.status === "failed"
                      ? "Products already created remain. Retry processes only unfinished rows in this job."
                      : job.status === "canceled"
                        ? "Products already created remain. Start a new attempt for unfinished products."
                        : "All products in this import have been created."}
                </p>
                {job.failureMessage && (
                  <FieldError>{job.failureMessage}</FieldError>
                )}
                {job.stagingPurgedAt ? (
                  <p>
                    Row details have expired. Already-created products remain in
                    the catalog.
                  </p>
                ) : (
                  <RowResults jobExternalId={jobExternalId!} />
                )}
              </section>
            )}
            {(issues.length > 0 ||
              error ||
              (job && !serverBusy && !clientBusy)) && (
              <Button
                className={CONTROL}
                variant="outline"
                disabled={
                  downloadPending ||
                  clientBusy ||
                  serverBusy ||
                  Boolean(job?.stagingPurgedAt)
                }
                onClick={() => void download("errors")}
              >
                <DownloadSimpleIcon data-icon="inline-start" />
                {downloadPending
                  ? "Preparing report…"
                  : "Download error workbook"}
              </Button>
            )}
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2 border-t px-5 py-3 sm:flex sm:flex-wrap">
            {closeWarning && (
              <FieldError className="col-span-2 sm:basis-full">
                {clientBusy
                  ? "Keep this tab open until uploads finish. Cancel upload to stop, then start fresh."
                  : "Wait for the current request to finish before closing."}
              </FieldError>
            )}
            {(workbookName || photos.size > 0 || jobExternalId) &&
              !clientBusy &&
              !serverBusy && (
                <Button
                  className={CONTROL}
                  variant="outline"
                  disabled={actionBusy}
                  onClick={() => void freshAttempt()}
                >
                  {jobExternalId ? "New attempt" : "Reset"}
                </Button>
              )}
            {(clientBusy ||
              (job && !["completed", "canceled"].includes(job.status))) && (
              <Button
                className={CONTROL}
                variant="outline"
                disabled={cancelRequested || actionBusy}
                onClick={() => void cancel()}
              >
                {cancelRequested
                  ? "Canceling…"
                  : clientBusy
                    ? "Cancel upload"
                    : "Cancel import"}
              </Button>
            )}
            <Button
              className={CONTROL}
              variant="outline"
              onClick={() => changeOpen(false)}
            >
              Close
            </Button>
            {job?.status === "failed" && !clientBusy && (
              <Button
                className={CONTROL}
                disabled={actionBusy || Boolean(job.stagingPurgedAt)}
                onClick={() => void retry()}
              >
                {actionBusy ? "Retrying…" : "Retry unfinished"}
              </Button>
            )}
            {!jobExternalId && (
              <Button
                className="col-span-2 min-h-11 sm:min-h-10"
                disabled={!ready}
                onClick={() => void runImport()}
              >
                <UploadSimpleIcon data-icon="inline-start" />
                Create products
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
