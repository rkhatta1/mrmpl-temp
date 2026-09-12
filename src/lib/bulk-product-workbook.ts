import type { CellValue, Workbook, Worksheet } from "exceljs";
import type { AdminCatalogSummary } from "./admin-catalog";
import {
  BULK_PRODUCT_HEADERS,
  MAX_BULK_PRODUCT_ROWS,
  parseBulkProductSheet,
  type BulkProductImportRow,
  type BulkProductIssue,
} from "./bulk-product-upload";

const SCHEMA = "mrmpl.catalog-import";
const VERSION = "1";
const DIMENSION_HEADERS = ["part_code", "parameter", "value", "notes"] as const;
const REFERENCE_HEADERS = ["category", "subcategory"] as const;
const SHEETS = [
  "Instructions",
  "Products",
  "Dimensions",
  "References",
  "Metadata",
];
const MAX_WORKBOOK_BYTES = 10 * 1024 * 1024;
const MAX_PHYSICAL_PRODUCT_ROWS = 10_000;
const normalize = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

async function newWorkbook() {
  const { default: ExcelJS } = await import("exceljs");
  return new ExcelJS.Workbook();
}

async function bytes(workbook: Workbook) {
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

function headers(
  sheet: Worksheet,
  names: readonly string[],
  required: readonly string[] = [],
) {
  sheet.addRow([...names]);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: names.length },
  };
  sheet.getRow(1).height = 30;
  names.forEach((name, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = name === "description" ? 48 : 26;
    column.numFmt = "@";
    column.alignment = { vertical: "top", wrapText: true };
    const cell = sheet.getCell(1, index + 1);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: required.includes(name) ? "FF235D47" : "FF4D6259" },
    };
    if (required.includes(name)) cell.note = "Required field";
  });
}

export async function generateBulkProductWorkbook(
  catalog: AdminCatalogSummary,
) {
  const workbook = await newWorkbook();
  const instructions = workbook.addWorksheet("Instructions");
  headers(instructions, ["topic", "guidance"]);
  instructions.getColumn(1).width = 26;
  instructions.getColumn(2).width = 110;
  instructions.addRows([
    [
      "Start here",
      "Use Products for up to 3,000 NEW products. Green headers are required. Do not rename sheets or columns. Keep Metadata. Use literal values only: no formulas, embedded images, links, or dates.",
    ],
    [
      "Required fields",
      "product_name (200 characters), part_code (NN-NNN-NNN, text), category and subcategory (120 characters each), is_active (TRUE or FALSE). Existing part codes block the entire import.",
    ],
    [
      "Taxonomy",
      "References lists the current category/subcategory pairs. Category suggestions are hints: type new names when needed and accept Excel's warning. Subcategories belong to the category on that product row. Matching ignores case and repeated whitespace.",
    ],
    [
      "Dimensions",
      "One dimension per Dimensions row: part_code, parameter (200 characters), value (500), optional notes (500). Up to 50 dimensions per product. Every part_code must identify exactly one Products row.",
    ],
    [
      "Lists",
      "applications, certifications, additional_notes: one item per line (Alt+Enter in Excel), up to 50 items of 500 characters. Do not separate items with semicolons.",
    ],
    [
      "Photos (optional)",
      "photo_codes: one filename basename per line, in display order, up to 12. Example PHOTO-A then PHOTO-B matches PHOTO-A.jpg and PHOTO-B.png. Select flat image files separately; no ZIP or folders. Leave blank for no photos.",
    ],
    [
      "Photo identity",
      "Codes use 1–64 letters, numbers, hyphens or underscores, beginning with a letter or number. Codes ignore case. The same code must always use identical source bytes across the catalog; different bytes require a new code. PNG, JPEG, WebP or AVIF, nonempty and at most 25 MiB each.",
    ],
    [
      "Other field limits",
      "description: 10,000 characters. connections and assemblies: 2,000 each. Other scalar fields: 500 each. Preserve leading zeroes by keeping part codes formatted as text.",
    ],
    [
      "Import and recovery",
      "Keep the tab open through image preparation and uploads. Interrupted uploads restart fresh. Server processing continues afterward. Retry unfinished rows in the same job; products already created remain. Download the error workbook to correct failures.",
    ],
    [
      "Current catalog",
      `${catalog.products.length} products, ${catalog.categories.length} categories, ${catalog.subcategories.length} subcategories. Catalog limits: 5,000 / 200 / 2,000. This reference snapshot is checked again before import.`,
    ],
  ]);
  instructions.eachRow((row, index) => {
    if (index > 1) row.height = 58;
  });
  const products = workbook.addWorksheet("Products");
  headers(products, BULK_PRODUCT_HEADERS, [
    "product_name",
    "part_code",
    "category",
    "subcategory",
    "is_active",
  ]);
  headers(workbook.addWorksheet("Dimensions"), DIMENSION_HEADERS, [
    "part_code",
    "parameter",
    "value",
  ]);
  const references = workbook.addWorksheet("References");
  headers(references, REFERENCE_HEADERS);
  const ordered = [...catalog.categories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const category of ordered) {
    const children = catalog.subcategories.filter(
      (subcategory) => subcategory.categoryExternalId === category.externalId,
    );
    if (!children.length) references.addRow([category.name, ""]);
    for (const subcategory of children.sort((a, b) =>
      a.name.localeCompare(b.name),
    ))
      references.addRow([category.name, subcategory.name]);
  }
  const metadata = workbook.addWorksheet("Metadata", { state: "hidden" });
  headers(metadata, ["schema", "version"]);
  metadata.addRow([SCHEMA, VERSION]);
  if (references.rowCount > 1)
    workbook.definedNames.add(
      `'References'!$A$2:$A$${references.rowCount}`,
      "CatalogCategories",
    );
  for (let row = 2; row <= MAX_BULK_PRODUCT_ROWS + 1; row++) {
    if (references.rowCount > 1)
      products.getCell(row, 3).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ["CatalogCategories"],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "New category",
        error:
          "New categories are allowed. Continue to create this name during import.",
      };
    products.getCell(row, BULK_PRODUCT_HEADERS.length).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"TRUE,FALSE"'],
      showErrorMessage: true,
      errorStyle: "stop",
      error: "Choose TRUE or FALSE.",
    };
  }
  return bytes(workbook);
}

export function catalogImportIssues(
  rows: BulkProductImportRow[],
  catalog: AdminCatalogSummary,
): BulkProductIssue[] {
  const issues: BulkProductIssue[] = [];
  const parts = new Set(
    catalog.products.map((product) => normalize(product.partCode)),
  );
  const categories = new Set(
    catalog.categories.map((category) => normalize(category.name)),
  );
  const categoryById = new Map(
    catalog.categories.map((category) => [
      category.externalId,
      normalize(category.name),
    ]),
  );
  const subcategories = new Set(
    catalog.subcategories.map((subcategory) =>
      JSON.stringify([
        categoryById.get(subcategory.categoryExternalId),
        normalize(subcategory.name),
      ]),
    ),
  );
  const existingCategoryCount = categories.size;
  const existingSubcategoryCount = subcategories.size;
  for (const row of rows) {
    if (parts.has(normalize(row.partCode)))
      issues.push({
        sheet: "Products",
        row: row.rowNumber,
        column: "part_code",
        partCode: row.partCode,
        message:
          "Part code already exists. Remove this row; bulk import only creates new products.",
      });
    categories.add(normalize(row.categoryName));
    subcategories.add(
      JSON.stringify([
        normalize(row.categoryName),
        normalize(row.subcategoryName),
      ]),
    );
  }
  for (const [label, total, limit] of [
    ["Products", catalog.products.length + rows.length, 5000],
    [
      "Categories",
      catalog.categories.length + categories.size - existingCategoryCount,
      200,
    ],
    [
      "Subcategories",
      catalog.subcategories.length +
        subcategories.size -
        existingSubcategoryCount,
      2000,
    ],
  ] as const) {
    if (total > limit)
      issues.push({
        sheet: "Products",
        row: 1,
        message: `${label}: ${total.toLocaleString()} exceeds the catalog limit of ${limit.toLocaleString()}. Reduce the import.`,
      });
  }
  if (new Set(rows.flatMap((row) => row.photoCodes)).size > 3000)
    issues.push({
      sheet: "Products",
      row: 1,
      column: "photo_codes",
      message: "Use at most 3,000 distinct photo codes per import.",
    });
  return issues;
}

function literal(value: CellValue): string | number | boolean | null {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export async function parseBulkProductWorkbook(
  data: ArrayBuffer,
  catalog: AdminCatalogSummary,
) {
  const issues: BulkProductIssue[] = [];
  const rows: BulkProductImportRow[] = [];
  if (!data.byteLength || data.byteLength > MAX_WORKBOOK_BYTES)
    throw new Error("Choose a nonempty .xlsx workbook of at most 10 MiB.");
  const workbook = await newWorkbook();
  try {
    await workbook.xlsx.load(data);
  } catch {
    throw new Error(
      "This workbook could not be read. Use the generated .xlsx template and save it again.",
    );
  }
  for (const name of SHEETS)
    if (!workbook.getWorksheet(name))
      issues.push({
        sheet: name,
        row: 1,
        message: `Missing required sheet: ${name}. Download a new template.`,
      });
  for (const sheet of workbook.worksheets)
    if (!SHEETS.includes(sheet.name))
      issues.push({
        sheet: sheet.name,
        row: 1,
        message: "Unexpected sheet. Use only the five official sheets.",
      });
  const metadata = workbook.getWorksheet("Metadata");
  if (
    metadata?.getCell("A2").value !== SCHEMA ||
    String(metadata?.getCell("B2").value) !== VERSION
  )
    issues.push({
      sheet: "Metadata",
      row: 2,
      message: "Unsupported schema/version. Download a new template.",
    });
  const limits: Record<string, number> = {
    Products: MAX_PHYSICAL_PRODUCT_ROWS,
    Dimensions: 160_000,
    Instructions: 100,
    References: 3000,
    Metadata: 10,
  };
  for (const sheet of workbook.worksheets) {
    let lastRow = 0;
    let lastColumn = 0;
    sheet.eachRow((row) =>
      row.eachCell((cell, column) => {
        if (cell.value !== null && cell.value !== "") {
          lastRow = Math.max(lastRow, row.number);
          lastColumn = Math.max(lastColumn, column);
        }
      }),
    );
    if (lastRow > (limits[sheet.name] ?? 0) || lastColumn > 40)
      issues.push({
        sheet: sheet.name,
        row: 1,
        message:
          "Worksheet is too large. Remove excess rows/columns and use the official template.",
      });
  }
  if (issues.length) return { rows, issues };
  for (const sheet of workbook.worksheets) {
    if (sheet.getImages().length || sheet.getBackgroundImageId() !== undefined)
      issues.push({
        sheet: sheet.name,
        row: 1,
        message: "Remove embedded images; select photo files separately.",
      });
    sheet.eachRow((row) =>
      row.eachCell((cell) => {
        const header = sheet.getRow(1).getCell(cell.col).value;
        const column = typeof header === "string" ? header : String(cell.col);
        if (
          cell.value !== null &&
          (literal(cell.value) === null ||
            (typeof cell.value === "boolean" &&
              !(sheet.name === "Products" && header === "is_active")))
        )
          issues.push({
            sheet: sheet.name,
            row: row.number,
            column,
            message:
              "Use literal text or numbers (TRUE/FALSE only for is_active). Formulas (including cached/shared formulas), dates, links, rich text and error cells are not supported.",
          });
        if (cell.isMerged)
          issues.push({
            sheet: sheet.name,
            row: row.number,
            column: String(cell.col),
            message: "Unmerge this cell; each field needs its own cell.",
          });
      }),
    );
  }
  function readTable(name: string, expected: readonly string[]) {
    const sheet = workbook.getWorksheet(name)!;
    const found = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, column) => {
      const header = typeof cell.value === "string" ? cell.value : "";
      if (!expected.includes(header))
        issues.push({
          sheet: name,
          row: 1,
          column: String(column),
          message: `Unexpected header: ${header || "non-text header"}.`,
        });
      else if (found.has(header))
        issues.push({
          sheet: name,
          row: 1,
          column: header,
          message: "Duplicate header.",
        });
      else found.set(header, column);
    });
    for (const header of expected)
      if (!found.has(header))
        issues.push({
          sheet: name,
          row: 1,
          column: header,
          message: "Missing required template column.",
        });
    sheet.eachRow((row) => {
      if (row.number > 1)
        row.eachCell((cell, column) => {
          if (!Array.from(found.values()).includes(column) && cell.value !== "")
            issues.push({
              sheet: name,
              row: row.number,
              column: String(column),
              message: "Value has no supported column header.",
            });
        });
    });
    return { sheet, found };
  }
  const productTable = readTable("Products", BULK_PRODUCT_HEADERS);
  const dimensionTable = readTable("Dimensions", DIMENSION_HEADERS);
  readTable("References", REFERENCE_HEADERS);
  readTable("Instructions", ["topic", "guidance"]);
  readTable("Metadata", ["schema", "version"]);
  if (
    issues.some(
      (issue) =>
        issue.row === 1 &&
        (issue.sheet === "Products" || issue.sheet === "Dimensions"),
    )
  )
    return { rows, issues };
  const productValues: unknown[][] = [[...BULK_PRODUCT_HEADERS]];
  productTable.sheet.eachRow((row) => {
    if (row.number === 1) return;
    productValues[row.number - 1] = BULK_PRODUCT_HEADERS.map((header) =>
      literal(row.getCell(productTable.found.get(header)!).value),
    );
  });
  // Preserve physical worksheet rows, including interior blank rows.
  for (let i = 1; i < productValues.length; i++) productValues[i] ??= [];
  const parsed = parseBulkProductSheet(productValues);
  rows.push(...parsed.rows);
  issues.push(
    ...parsed.issues.map((issue) => ({ ...issue, sheet: "Products" })),
  );
  const productsByCode = new Map<string, BulkProductImportRow[]>();
  for (const row of rows) {
    const key = normalize(row.partCode);
    productsByCode.set(key, [...(productsByCode.get(key) ?? []), row]);
  }
  dimensionTable.sheet.eachRow((source) => {
    if (source.number === 1 || !source.hasValues) return;
    const get = (column: (typeof DIMENSION_HEADERS)[number]) => {
      const value = literal(
        source.getCell(dimensionTable.found.get(column)!).value,
      );
      return typeof value === "string" || typeof value === "number"
        ? String(value).trim()
        : "";
    };
    const partCode = get("part_code");
    const parameter = get("parameter").replace(/\s+/g, " ");
    const value = get("value").replace(/\s+/g, " ");
    const notes = get("notes");
    if (![partCode, parameter, value, notes].some(Boolean)) return;
    const issue = (column: string, message: string) =>
      issues.push({
        sheet: "Dimensions",
        row: source.number,
        column,
        partCode,
        message,
      });
    const linked = productsByCode.get(normalize(partCode));
    if (!linked || linked.length !== 1)
      issue(
        "part_code",
        "Dimension must reference exactly one Products row; fix missing or duplicate part codes.",
      );
    for (const [column, text, limit, required] of [
      ["parameter", parameter, 200, true],
      ["value", value, 500, true],
      ["notes", notes, 500, false],
    ] as const) {
      if (required && !text) issue(column, "This field is required.");
      if (text.length > limit)
        issue(column, `Use at most ${limit} characters.`);
    }
    if (linked?.length === 1) {
      linked[0].dimensions.push({
        parameter,
        value,
        ...(notes ? { notes } : {}),
      });
      if (linked[0].dimensions.length > 50)
        issue("part_code", "A product can contain at most 50 dimensions.");
    }
  });
  issues.push(...catalogImportIssues(rows, catalog));
  for (const issue of issues) {
    if (!issue.partCode && issue.sheet === "Products")
      issue.partCode = rows.find(
        (row) => row.rowNumber === issue.row,
      )?.partCode;
  }
  return { rows, issues };
}

export async function generateBulkProductErrorWorkbook(
  issues: readonly BulkProductIssue[],
) {
  const workbook = await newWorkbook();
  const sheet = workbook.addWorksheet("Errors");
  headers(sheet, ["sheet", "row", "part_code", "column", "message"]);
  sheet.getColumn(5).width = 100;
  for (const issue of issues)
    sheet.addRow([
      issue.sheet ?? "Products",
      issue.row,
      issue.partCode ?? "",
      issue.column ?? "",
      issue.message,
    ]);
  // String cell values remain literal even when they start with =, +, - or @.
  return bytes(workbook);
}

export function downloadBulkProductWorkbook(
  data: Uint8Array<ArrayBuffer>,
  filename: string,
) {
  const url = URL.createObjectURL(
    new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
