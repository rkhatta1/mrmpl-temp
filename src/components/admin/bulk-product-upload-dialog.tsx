"use client";

import {
  CheckCircleIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  FileIcon,
  ImageIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { readSheet } from "read-excel-file/browser";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminCatalogSummary } from "@/lib/admin-catalog";
import {
  hashBulkProductPhotoFile,
  parseBulkProductPhotoVariantFilename,
} from "@/lib/bulk-product-photo-contract";
import {
  parseBulkProductSheet,
  photoCodeFromFileName,
  type BulkProductImportRow,
  type BulkProductParseResult,
} from "@/lib/bulk-product-upload";
import { optimizeBulkProductPhotoVariants } from "@/lib/product-image-optimizer";
import { useUploadThing } from "@/lib/uploadthing-client";

const TEMPLATE_PATH = "/templates/mrmpl-product-bulk-upload-template.xlsx";
const PHOTO_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type PhotoSelection = {
  filesByCode: Map<string, File>;
  issues: string[];
};

const EMPTY_PHOTOS: PhotoSelection = {
  filesByCode: new Map(),
  issues: [],
};

type PhotoUploadVariant = {
  width: number;
  customId: string;
  fileKey: string;
  size: number;
  url: string;
};

const createJobReference = makeFunctionReference<
  "mutation",
  { workbookName: string; expectedRowCount: number; expectedPhotoCount: number },
  { externalId: string }
>("catalogImport:createJob");
const stageRowsReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string; rows: BulkProductImportRow[] },
  { stagedRowCount: number }
>("catalogImport:stageRows");
const resolvePhotosReference = makeFunctionReference<
  "mutation",
  {
    jobExternalId: string;
    photos: Array<{ code: string; contentHash: string; sourceName: string }>;
  },
  {
    uploads: Array<{ code: string; contentHash: string }>;
    reusedCount: number;
  }
>("catalogImport:resolvePhotos");
const registerPhotosReference = makeFunctionReference<
  "mutation",
  {
    jobExternalId: string;
    assets: Array<{
      contentHash: string;
      canonicalUrl: string;
      variants: PhotoUploadVariant[];
    }>;
  },
  { registeredCodeCount: number }
>("catalogImport:registerUploadedPhotos");
const startImportReference = makeFunctionReference<
  "mutation",
  { jobExternalId: string },
  null
>("catalogImport:startImport");
const getJobReference = makeFunctionReference<
  "query",
  { jobExternalId: string },
  {
    externalId: string;
    workbookName: string;
    status: "staging" | "ready" | "importing" | "completed" | "failed";
    expectedRowCount: number;
    stagedRowCount: number;
    processedRowCount: number;
    createdProductCount: number;
    skippedProductCount: number;
    errorCount: number;
    expectedPhotoCount: number;
    readyPhotoCount: number;
    distinctPhotoAssetCount: number;
    failureMessage: string | null;
  }
>("catalogImport:getJob");

function chunks<Value>(values: Value[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );
}

function fileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function BulkProductUploadDialog({
  catalog,
}: {
  catalog: AdminCatalogSummary | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [workbookName, setWorkbookName] = useState("");
  const [parseResult, setParseResult] = useState<BulkProductParseResult>();
  const [parseMessage, setParseMessage] = useState("");
  const [parsing, setParsing] = useState(false);
  const [photos, setPhotos] = useState<PhotoSelection>(EMPTY_PHOTOS);
  const [jobExternalId, setJobExternalId] = useState<string>();
  const [importPhase, setImportPhase] = useState("");
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const createJob = useMutation(createJobReference);
  const stageRows = useMutation(stageRowsReference);
  const resolvePhotos = useMutation(resolvePhotosReference);
  const registerPhotos = useMutation(registerPhotosReference);
  const startImport = useMutation(startImportReference);
  const job = useQuery(
    getJobReference,
    jobExternalId ? { jobExternalId } : "skip",
  );
  const { startUpload, isUploading } = useUploadThing("bulkProductPhoto", {
    onUploadProgress: setUploadProgress,
  });

  const requiredPhotoCodes = useMemo(
    () =>
      new Set(parseResult?.rows.flatMap((product) => product.photoCodes) ?? []),
    [parseResult],
  );
  const missingPhotoCodes = useMemo(
    () =>
      [...requiredPhotoCodes].filter((code) => !photos.filesByCode.has(code)),
    [photos, requiredPhotoCodes],
  );
  const unusedPhotoCodes = useMemo(
    () =>
      [...photos.filesByCode.keys()].filter(
        (code) => !requiredPhotoCodes.has(code),
      ),
    [photos, requiredPhotoCodes],
  );
  const catalogConflicts = useMemo(() => {
    if (!catalog || !parseResult) return [];
    const existing = new Set(
      catalog.products.map((product) => product.partCode.toLocaleLowerCase()),
    );
    return parseResult.rows.filter((product) =>
      existing.has(product.partCode.toLocaleLowerCase()),
    );
  }, [catalog, parseResult]);

  const blockingIssueCount =
    (parseResult?.issues.length ?? 0) +
    photos.issues.length +
    missingPhotoCodes.length;
  const warningCount = unusedPhotoCodes.length + catalogConflicts.length;
  const issueCount = blockingIssueCount + warningCount;
  const matchedPhotoCount = requiredPhotoCodes.size - missingPhotoCodes.length;
  const ready =
    Boolean(parseResult?.rows.length) &&
    blockingIssueCount === 0 &&
    catalog !== undefined;

  async function chooseWorkbook(file: File | undefined) {
    if (!file) return;
    setParsing(true);
    setWorkbookName(file.name);
    setParseResult(undefined);
    setParseMessage("");
    try {
      const rows = await readSheet(file, "Products");
      setParseResult(parseBulkProductSheet(rows));
    } catch (error) {
      setParseMessage(
        error instanceof Error
          ? error.message
          : "The workbook could not be read. Use the downloadable .xlsx template.",
      );
    } finally {
      setParsing(false);
    }
  }

  function choosePhotos(files: FileList | null) {
    if (!files) return;
    const filesByCode = new Map<string, File>();
    const issues: string[] = [];

    for (const file of files) {
      if (!PHOTO_TYPES.has(file.type)) {
        issues.push(`${file.name}: choose PNG, JPEG, WebP, or AVIF.`);
        continue;
      }
      const code = photoCodeFromFileName(file.name);
      if (!code) {
        issues.push(
          `${file.name}: filename must be a photo code using letters, numbers, hyphens, or underscores.`,
        );
        continue;
      }
      if (filesByCode.has(code)) {
        issues.push(
          `${file.name}: another selected photo already uses code ${code}.`,
        );
        continue;
      }
      filesByCode.set(code, file);
    }

    setPhotos({ filesByCode, issues });
  }

  function reset() {
    setWorkbookName("");
    setParseResult(undefined);
    setParseMessage("");
    setPhotos(EMPTY_PHOTOS);
    setJobExternalId(undefined);
    setImportPhase("");
    setUploadProgress(0);
  }

  async function runImport() {
    if (!ready || !parseResult || !workbookName) return;
    setImporting(true);
    setImportPhase("Preparing import");
    try {
      const created = await createJob({
        workbookName,
        expectedRowCount: parseResult.rows.length,
        expectedPhotoCount: requiredPhotoCodes.size,
      });
      setJobExternalId(created.externalId);

      setImportPhase("Staging products");
      for (const rows of chunks(parseResult.rows, 50)) {
        await stageRows({ jobExternalId: created.externalId, rows });
      }

      setImportPhase("Checking photo duplicates");
      const hashedPhotos = await Promise.all(
        [...requiredPhotoCodes].map(async (code) => {
          const file = photos.filesByCode.get(code)!;
          return {
            code,
            contentHash: await hashBulkProductPhotoFile(file),
            file,
            sourceName: file.name,
          };
        }),
      );
      const filesByHash = new Map(
        hashedPhotos.map((photo) => [photo.contentHash, photo.file]),
      );
      const uploads: Array<{ code: string; contentHash: string }> = [];
      for (const photoBatch of chunks(hashedPhotos, 100)) {
        const resolution = await resolvePhotos({
          jobExternalId: created.externalId,
          photos: photoBatch.map(({ code, contentHash, sourceName }) => ({
            code,
            contentHash,
            sourceName,
          })),
        });
        uploads.push(...resolution.uploads);
      }

      for (const [batchIndex, uploadBatch] of chunks(uploads, 10).entries()) {
        setImportPhase(
          `Optimizing photo batch ${batchIndex + 1} of ${Math.ceil(uploads.length / 10)}`,
        );
        const variants = (
          await Promise.all(
            uploadBatch.map(({ contentHash }) =>
              optimizeBulkProductPhotoVariants(filesByHash.get(contentHash)!, {
                contentHash,
              }),
            ),
          )
        ).flat();
        setImportPhase(
          `Uploading photo batch ${batchIndex + 1} of ${Math.ceil(uploads.length / 10)}`,
        );
        const uploadedFiles = await startUpload(
          variants.map((variant) => variant.file),
        );
        const uploaded =
          uploadedFiles?.flatMap((item) =>
            item.serverData ? [item.serverData] : [],
          ) ?? [];
        if (uploaded.length !== variants.length) {
          throw new Error("A responsive photo upload did not finish.");
        }
        await registerPhotos({
          jobExternalId: created.externalId,
          assets: uploadBatch.map(({ contentHash }) => {
            const photoVariants = uploaded.flatMap((item) => {
              const identity = parseBulkProductPhotoVariantFilename(
                `${item.customId}.webp`,
              );
              if (!identity || identity.contentHash !== contentHash) return [];
              return [
                {
                  customId: identity.customId,
                  fileKey: item.fileKey,
                  size: item.size,
                  url: item.url,
                  width: identity.width,
                },
              ];
            });
            const canonicalUrl = photoVariants.find(
              (variant) => variant.width === 1080,
            )?.url;
            if (photoVariants.length !== 4 || !canonicalUrl) {
              throw new Error("A responsive photo set is incomplete.");
            }
            return { canonicalUrl, contentHash, variants: photoVariants };
          }),
        });
      }

      setImportPhase("Creating products");
      await startImport({ jobExternalId: created.externalId });
      toast.success("Bulk import started. You can follow its progress here.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The bulk import could not start.",
      );
    } finally {
      setImporting(false);
      setUploadProgress(0);
    }
  }

  return (
    <>
      <Button
        disabled={catalog === undefined}
        size="lg"
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <UploadSimpleIcon data-icon="inline-start" />
        Bulk upload
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="border-b px-5 py-4 pr-12">
            <DialogTitle className="text-base">Bulk product upload</DialogTitle>
            <DialogDescription>
              Validate the product workbook and its separately selected photos
              before anything is imported.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileIcon />
                    </span>
                    1. Product workbook
                  </CardTitle>
                  <CardDescription>
                    One row per product. Keep template column names unchanged.
                  </CardDescription>
                  <CardAction>
                    <Button
                      nativeButton={false}
                      render={<a download href={TEMPLATE_PATH} />}
                      size="sm"
                      variant="ghost"
                    >
                      <DownloadSimpleIcon data-icon="inline-start" />
                      Template
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    id="bulk-product-workbook"
                    type="file"
                    onChange={(event) => {
                      void chooseWorkbook(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <Button
                    className="w-full"
                    disabled={parsing}
                    nativeButton={false}
                    render={<label htmlFor="bulk-product-workbook" />}
                    variant="outline"
                  >
                    <UploadSimpleIcon data-icon="inline-start" />
                    {parsing ? "Reading workbook…" : "Choose Excel file"}
                  </Button>
                  {workbookName ? (
                    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2">
                      <span className="min-w-0 truncate font-medium">
                        {workbookName}
                      </span>
                      {parseResult && parseResult.issues.length === 0 ? (
                        <CheckCircleIcon className="size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <WarningCircleIcon className="size-4 shrink-0 text-amber-600" />
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ImageIcon />
                    </span>
                    2. Product photos
                  </CardTitle>
                  <CardDescription>
                    Name each photo with its code, for example SLEEVE-01.jpg.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    multiple
                    accept="image/avif,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    id="bulk-product-photos"
                    type="file"
                    onChange={(event) => {
                      choosePhotos(event.target.files);
                      event.target.value = "";
                    }}
                  />
                  <Button
                    className="w-full"
                    nativeButton={false}
                    render={<label htmlFor="bulk-product-photos" />}
                    variant="outline"
                  >
                    <UploadSimpleIcon data-icon="inline-start" />
                    Choose photos
                  </Button>
                  {photos.filesByCode.size > 0 ? (
                    <div className="rounded-md bg-muted/60 px-3 py-2">
                      <div className="font-medium">
                        {photos.filesByCode.size.toLocaleString()} coded photos
                        selected
                      </div>
                      <div className="mt-0.5 text-muted-foreground">
                        {fileSize(
                          [...photos.filesByCode.values()].reduce(
                            (total, file) => total + file.size,
                            0,
                          ),
                        )}{" "}
                        total
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {parseResult ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Products", parseResult.rows.length],
                  ["Photo codes", requiredPhotoCodes.size],
                  ["Matched photos", matchedPhotoCount],
                  ["Issues", issueCount],
                ].map(([label, value]) => (
                  <div className="rounded-lg border px-3 py-3" key={label}>
                    <div className="text-lg font-semibold tabular-nums">
                      {Number(value).toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {parseMessage ? (
              <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                {parseMessage}
              </div>
            ) : null}

            {issueCount > 0 ? (
              <div className="mt-5 rounded-lg border">
                <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                  <div>
                    <div className="font-medium">
                      {blockingIssueCount > 0
                        ? "Resolve before import"
                        : "Import warnings"}
                    </div>
                    <div className="text-muted-foreground">
                      Showing the first issues found in this package.
                    </div>
                  </div>
                  <Badge
                    variant={blockingIssueCount > 0 ? "destructive" : "secondary"}
                  >
                    {issueCount} {blockingIssueCount > 0 ? "issues" : "warnings"}
                  </Badge>
                </div>
                <div className="max-h-44 space-y-2 overflow-y-auto px-4 py-3">
                  {parseResult?.issues.slice(0, 8).map((issue, index) => (
                    <div
                      className="flex gap-2"
                      key={`${issue.row}-${issue.column}-${index}`}
                    >
                      <WarningCircleIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      <span>
                        Row {issue.row}
                        {issue.column ? ` · ${issue.column}` : ""}:{" "}
                        {issue.message}
                      </span>
                    </div>
                  ))}
                  {catalogConflicts.slice(0, 5).map((product) => (
                    <div
                      className="flex gap-2"
                      key={`conflict-${product.rowNumber}`}
                    >
                      <WarningCircleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                      <span>
                        Row {product.rowNumber} · part_code: {product.partCode}{" "}
                        already exists and will be skipped.
                      </span>
                    </div>
                  ))}
                  {missingPhotoCodes.slice(0, 5).map((code) => (
                    <div className="flex gap-2" key={`missing-${code}`}>
                      <WarningCircleIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      <span>Missing photo for code {code}.</span>
                    </div>
                  ))}
                  {unusedPhotoCodes.slice(0, 5).map((code) => (
                    <div className="flex gap-2" key={`unused-${code}`}>
                      <WarningCircleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                      <span>
                        Selected photo {code} is not referenced by the workbook.
                      </span>
                    </div>
                  ))}
                  {photos.issues.slice(0, 5).map((issue) => (
                    <div className="flex gap-2" key={issue}>
                      <WarningCircleIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {ready ? (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-600/20 bg-emerald-500/5 p-4">
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <div>
                  <div className="font-medium text-emerald-800">
                    Package ready
                  </div>
                  <div className="mt-0.5 text-muted-foreground">
                    All product rows and photo-code references passed local
                    validation.
                  </div>
                </div>
              </div>
            ) : null}

            {job ? (
              <div className="mt-5 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">
                    Import {job.status === "completed" ? "complete" : "progress"}
                  </div>
                  <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                    {job.status}
                  </Badge>
                </div>
                <div className="mt-2 text-muted-foreground">
                  {job.processedRowCount.toLocaleString()} of{" "}
                  {job.expectedRowCount.toLocaleString()} products processed ·{" "}
                  {job.createdProductCount.toLocaleString()} created ·{" "}
                  {job.skippedProductCount.toLocaleString()} skipped ·{" "}
                  {job.errorCount.toLocaleString()} errors
                </div>
                <div className="mt-1 text-muted-foreground">
                  {job.readyPhotoCount.toLocaleString()} photo codes ·{" "}
                  {job.distinctPhotoAssetCount.toLocaleString()} distinct images
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t px-5 py-4">
            {(workbookName || photos.filesByCode.size > 0) && (
              <Button
                disabled={importing || isUploading || job?.status === "importing"}
                type="button"
                variant="ghost"
                onClick={reset}
              >
                Reset
              </Button>
            )}
            <DialogClose render={<Button variant="outline" />}>
              Close
            </DialogClose>
            <Button
              disabled={!ready || importing || isUploading || Boolean(jobExternalId)}
              type="button"
              onClick={() => void runImport()}
            >
              {importing || isUploading ? (
                <CircleNotchIcon className="animate-spin" data-icon="inline-start" />
              ) : (
                <UploadSimpleIcon data-icon="inline-start" />
              )}
              {isUploading
                ? `Uploading ${Math.round(uploadProgress)}%`
                : importing
                  ? importPhase
                  : "Start import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
