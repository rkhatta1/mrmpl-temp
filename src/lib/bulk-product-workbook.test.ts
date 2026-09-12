import { expect, test } from "bun:test";
import ExcelJS from "exceljs";
import { BULK_PRODUCT_HEADERS } from "./bulk-product-upload";
import {
  generateBulkProductErrorWorkbook,
  generateBulkProductWorkbook,
  parseBulkProductWorkbook,
} from "./bulk-product-workbook";

const catalog = {
  categories: [{ externalId: "existing", name: "Valves", description: "" }],
  subcategories: [
    { externalId: "child", categoryExternalId: "existing", name: "Ball" },
  ],
  products: [],
};
const product = (partCode: string) => {
  const values: Partial<
    Record<(typeof BULK_PRODUCT_HEADERS)[number], string | boolean>
  > = {
    product_name: "Valve",
    part_code: partCode,
    category: " New category ",
    subcategory: "Ball",
    is_active: false,
    photo_codes: "photo-a\nPHOTO-B",
    applications: "Chemical; oil\nWater",
  };
  return BULK_PRODUCT_HEADERS.map((header) => values[header] ?? "");
};

test("official workbook round trip preserves physical rows, ordered photos, dimensions and reference hints", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load((await generateBulkProductWorkbook(catalog)).buffer);
  expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
    "Instructions",
    "Products",
    "Dimensions",
    "References",
    "Metadata",
  ]);
  expect(workbook.getWorksheet("Metadata")!.state).toBe("hidden");
  const products = workbook.getWorksheet("Products")!;
  products.getRow(2).values = product("99-001-001");
  products.getRow(5).values = product("99-001-002");
  products.getCell("A10001").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFFFF" },
  };
  workbook
    .getWorksheet("Dimensions")!
    .addRow(["99-001-002", "A", 12, "Length"]);
  const parsed = await parseBulkProductWorkbook(
    new Uint8Array(await workbook.xlsx.writeBuffer()).buffer,
    catalog,
  );
  expect(parsed.issues).toEqual([]);
  expect(parsed.rows.map((row) => row.rowNumber)).toEqual([2, 5]);
  expect(parsed.rows[1]).toMatchObject({
    categoryName: "New category",
    subcategoryName: "Ball",
    photoCodes: ["PHOTO-A", "PHOTO-B"],
    applications: ["Chemical; oil", "Water"],
    dimensions: [{ parameter: "A", value: "12", notes: "Length" }],
  });
});

test("cached formulas block import and reports preserve literal messages and source coordinates", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load((await generateBulkProductWorkbook(catalog)).buffer);
  const products = workbook.getWorksheet("Products")!;
  products.getRow(5).values = product("99-001-005");
  products.getCell("F5").value = { formula: '"Steel"', result: "Steel" };
  const parsed = await parseBulkProductWorkbook(
    new Uint8Array(await workbook.xlsx.writeBuffer()).buffer,
    catalog,
  );
  expect(
    parsed.issues.some(
      (issue) =>
        issue.sheet === "Products" &&
        issue.row === 5 &&
        issue.message.includes("Formulas"),
    ),
  ).toBe(true);
  const report = new ExcelJS.Workbook();
  await report.xlsx.load(
    (
      await generateBulkProductErrorWorkbook([
        ...parsed.issues,
        {
          sheet: "Products",
          row: 5,
          partCode: "99-001-005",
          column: "material",
          message: "=literal; message",
        },
      ])
    ).buffer,
  );
  expect(report.getWorksheet("Errors")!.lastRow!.getCell(5).value).toBe(
    "=literal; message",
  );
});
