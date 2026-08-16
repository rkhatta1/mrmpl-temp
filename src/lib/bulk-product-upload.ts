import type { CatalogDimension } from "@/lib/admin-catalog";

export const BULK_PRODUCT_HEADERS = [
  "product_name",
  "part_code",
  "category",
  "subcategory",
  "size",
  "material",
  "type",
  "finish_plating",
  "thread_standard",
  "sealant",
  "temperature",
  "pressure",
  "connections",
  "assemblies",
  "grade",
  "description",
  "applications",
  "certifications",
  "additional_notes",
  "dimensions",
  "photo_codes",
  "is_active",
] as const;

export const MAX_BULK_PRODUCT_ROWS = 3_000;

export type BulkProductHeader = (typeof BULK_PRODUCT_HEADERS)[number];

export type BulkProductImportRow = {
  rowNumber: number;
  productName: string;
  partCode: string;
  categoryName: string;
  subcategoryName: string;
  size: string;
  material: string;
  type: string;
  finishPlating: string;
  threadStandard: string;
  sealant: string;
  temperature: string;
  pressure: string;
  connections: string;
  assemblies: string;
  grade: string;
  description: string;
  applications: string[];
  certifications: string[];
  additionalNotes: string[];
  dimensions: CatalogDimension[];
  photoCodes: string[];
  isActive: boolean;
};

export type BulkProductIssue = {
  row: number;
  column?: BulkProductHeader;
  message: string;
};

export type BulkProductParseResult = {
  rows: BulkProductImportRow[];
  issues: BulkProductIssue[];
};

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function splitList(value: string) {
  return [
    ...new Set(
      value
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function parseDimensions(
  value: string,
  row: number,
  issues: BulkProductIssue[],
) {
  const dimensions: CatalogDimension[] = [];

  for (const item of splitList(value)) {
    const [definition, ...extraNotes] = item.split("|");
    const separator = definition.indexOf("=");
    const parameter =
      separator >= 0 ? definition.slice(0, separator).trim() : "";
    const dimensionValue =
      separator >= 0 ? definition.slice(separator + 1).trim() : "";
    const notes = extraNotes.join("|").trim();

    if (!parameter || !dimensionValue) {
      issues.push({
        row,
        column: "dimensions",
        message:
          "Use Parameter=Value or Parameter=Value|Notes for every dimension.",
      });
      continue;
    }

    dimensions.push({
      parameter,
      value: dimensionValue,
      ...(notes ? { notes } : {}),
    });
  }

  if (dimensions.length > 50) {
    issues.push({
      row,
      column: "dimensions",
      message: "A product can contain at most 50 dimensions.",
    });
  }

  return dimensions;
}

export function normalizePhotoCode(value: unknown) {
  const code = cellText(value).toLocaleUpperCase();
  return /^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(code) ? code : null;
}

export function photoCodeFromFileName(fileName: string) {
  const trimmed = fileName.trim();
  const extensionIndex = trimmed.lastIndexOf(".");
  if (extensionIndex <= 0) return null;
  return normalizePhotoCode(trimmed.slice(0, extensionIndex));
}

function requiredText(
  value: string,
  row: number,
  column: BulkProductHeader,
  maxLength: number,
  issues: BulkProductIssue[],
) {
  if (!value) {
    issues.push({ row, column, message: `${column} is required.` });
  } else if (value.length > maxLength) {
    issues.push({
      row,
      column,
      message: `${column} must be at most ${maxLength} characters.`,
    });
  }
}

function optionalText(
  value: string,
  row: number,
  column: BulkProductHeader,
  maxLength: number,
  issues: BulkProductIssue[],
) {
  if (value.length > maxLength) {
    issues.push({
      row,
      column,
      message: `${column} must be at most ${maxLength} characters.`,
    });
  }
}

function parseActive(value: unknown, row: number, issues: BulkProductIssue[]) {
  if (value === true || cellText(value).toLocaleUpperCase() === "TRUE") {
    return true;
  }
  if (value === false || cellText(value).toLocaleUpperCase() === "FALSE") {
    return false;
  }
  issues.push({
    row,
    column: "is_active",
    message: "is_active must be TRUE or FALSE.",
  });
  return false;
}

export function parseBulkProductSheet(
  sheet: readonly (readonly unknown[])[],
): BulkProductParseResult {
  const issues: BulkProductIssue[] = [];
  const rows: BulkProductImportRow[] = [];
  const headerRow = sheet[0] ?? [];
  const headerIndexes = new Map<string, number>();

  headerRow.forEach((value, index) => {
    const header = cellText(value).toLocaleLowerCase();
    if (header && !headerIndexes.has(header)) headerIndexes.set(header, index);
  });

  for (const header of BULK_PRODUCT_HEADERS) {
    if (!headerIndexes.has(header)) {
      issues.push({
        row: 1,
        column: header,
        message: `Missing required template column: ${header}.`,
      });
    }
  }

  if (issues.length > 0) return { rows, issues };

  const dataRows = sheet
    .slice(1)
    .filter((row) => row.some((value) => cellText(value) !== ""));
  if (dataRows.length === 0) {
    issues.push({
      row: 2,
      message: "The Products sheet contains no product rows.",
    });
    return { rows, issues };
  }
  if (dataRows.length > MAX_BULK_PRODUCT_ROWS) {
    issues.push({
      row: MAX_BULK_PRODUCT_ROWS + 2,
      message: `Upload at most ${MAX_BULK_PRODUCT_ROWS.toLocaleString()} products per workbook.`,
    });
  }

  const seenPartCodes = new Map<string, number>();

  dataRows.slice(0, MAX_BULK_PRODUCT_ROWS).forEach((sourceRow, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const get = (header: BulkProductHeader) =>
      sourceRow[headerIndexes.get(header)!];
    const text = (header: BulkProductHeader) => cellText(get(header));

    const productName = text("product_name");
    const partCode = text("part_code");
    const categoryName = text("category");
    const subcategoryName = text("subcategory");
    const size = text("size");
    const material = text("material");
    const type = text("type");
    const finishPlating = text("finish_plating");
    const threadStandard = text("thread_standard");
    const sealant = text("sealant");
    const temperature = text("temperature");
    const pressure = text("pressure");
    const connections = text("connections");
    const assemblies = text("assemblies");
    const grade = text("grade");
    const description = text("description");

    requiredText(productName, rowNumber, "product_name", 200, issues);
    requiredText(partCode, rowNumber, "part_code", 120, issues);
    requiredText(categoryName, rowNumber, "category", 120, issues);
    requiredText(subcategoryName, rowNumber, "subcategory", 120, issues);
    optionalText(size, rowNumber, "size", 500, issues);
    optionalText(material, rowNumber, "material", 500, issues);
    optionalText(type, rowNumber, "type", 500, issues);
    optionalText(finishPlating, rowNumber, "finish_plating", 500, issues);
    optionalText(threadStandard, rowNumber, "thread_standard", 500, issues);
    optionalText(sealant, rowNumber, "sealant", 500, issues);
    optionalText(temperature, rowNumber, "temperature", 500, issues);
    optionalText(pressure, rowNumber, "pressure", 500, issues);
    optionalText(connections, rowNumber, "connections", 2_000, issues);
    optionalText(assemblies, rowNumber, "assemblies", 2_000, issues);
    optionalText(grade, rowNumber, "grade", 500, issues);
    optionalText(description, rowNumber, "description", 10_000, issues);

    const normalizedPartCode = partCode.toLocaleLowerCase();
    const previousRow = seenPartCodes.get(normalizedPartCode);
    if (normalizedPartCode && previousRow) {
      issues.push({
        row: rowNumber,
        column: "part_code",
        message: `Duplicate part_code; first used on row ${previousRow}.`,
      });
    } else if (normalizedPartCode) {
      seenPartCodes.set(normalizedPartCode, rowNumber);
    }

    const applications = splitList(text("applications"));
    const certifications = splitList(text("certifications"));
    const additionalNotes = splitList(text("additional_notes"));
    for (const [column, values] of [
      ["applications", applications],
      ["certifications", certifications],
      ["additional_notes", additionalNotes],
    ] as const) {
      if (values.length > 50) {
        issues.push({
          row: rowNumber,
          column,
          message: `${column} can contain at most 50 values.`,
        });
      }
      if (values.some((value) => value.length > 500)) {
        issues.push({
          row: rowNumber,
          column,
          message: `${column} values must be at most 500 characters.`,
        });
      }
    }

    const photoCodes = splitList(text("photo_codes")).flatMap((value) => {
      const normalized = normalizePhotoCode(value);
      if (normalized) return [normalized];
      issues.push({
        row: rowNumber,
        column: "photo_codes",
        message: `Invalid photo code: ${value}. Use letters, numbers, hyphens, or underscores.`,
      });
      return [];
    });
    if (photoCodes.length > 12) {
      issues.push({
        row: rowNumber,
        column: "photo_codes",
        message: "A product can reference at most 12 photo codes.",
      });
    }

    rows.push({
      rowNumber,
      productName,
      partCode,
      categoryName,
      subcategoryName,
      size,
      material,
      type,
      finishPlating,
      threadStandard,
      sealant,
      temperature,
      pressure,
      connections,
      assemblies,
      grade,
      description,
      applications,
      certifications,
      additionalNotes,
      dimensions: parseDimensions(text("dimensions"), rowNumber, issues),
      photoCodes,
      isActive: parseActive(get("is_active"), rowNumber, issues),
    });
  });

  return { rows, issues };
}
