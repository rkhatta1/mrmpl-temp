"use client";

import {
  CheckCircleIcon,
  DownloadSimpleIcon,
  FileIcon,
  ImageIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { readSheet } from "read-excel-file/browser";
import { useMemo, useState } from "react";

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
  parseBulkProductSheet,
  photoCodeFromFileName,
  type BulkProductParseResult,
} from "@/lib/bulk-product-upload";

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

  const issueCount =
    (parseResult?.issues.length ?? 0) +
    photos.issues.length +
    missingPhotoCodes.length +
    unusedPhotoCodes.length +
    catalogConflicts.length;
  const matchedPhotoCount = requiredPhotoCodes.size - missingPhotoCodes.length;
  const ready =
    Boolean(parseResult?.rows.length) &&
    issueCount === 0 &&
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
              <Card>
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

              <Card>
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
                    <div className="font-medium">Resolve before import</div>
                    <div className="text-muted-foreground">
                      Showing the first issues found in this package.
                    </div>
                  </div>
                  <Badge variant="destructive">{issueCount} issues</Badge>
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
                      <WarningCircleIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      <span>
                        Row {product.rowNumber} · part_code: {product.partCode}{" "}
                        already exists.
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
          </div>

          <DialogFooter className="border-t px-5 py-4">
            {(workbookName || photos.filesByCode.size > 0) && (
              <Button type="button" variant="ghost" onClick={reset}>
                Reset
              </Button>
            )}
            <DialogClose render={<Button variant="outline" />}>
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
