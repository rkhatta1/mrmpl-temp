import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { BULK_PRODUCT_HEADERS } from "../src/lib/bulk-product-upload";

const outputDirectory = path.resolve(
  "outputs/bulk-product-upload-local-test",
);
const svgDirectory = path.join(outputDirectory, "source-svg");
const pngDirectory = path.join(outputDirectory, "photos");

const categoryDefinitions = [
  {
    name: "Flow Control Valves",
    subcategories: ["Ball Valves", "Needle Valves", "Check Valves", "Gate Valves"],
  },
  {
    name: "Tube Fittings",
    subcategories: ["Elbows", "Tees", "Unions", "Reducers", "Bulkhead Fittings"],
  },
  {
    name: "Pressure Systems",
    subcategories: [
      "Pressure Gauges",
      "Regulators",
      "Relief Valves",
      "Manifolds",
      "Transmitters",
      "Snubbers",
    ],
  },
  {
    name: "Instrumentation",
    subcategories: ["Thermowells", "Level Indicators", "Flow Meters", "Sampling Systems"],
  },
  {
    name: "Process Accessories",
    subcategories: ["Filters", "Strainers", "Sight Glasses", "Hose Assemblies", "Mounting Kits"],
  },
] as const;

const colors = [
  ["#0F766E", "#5EEAD4"],
  ["#1D4ED8", "#93C5FD"],
  ["#7C3AED", "#C4B5FD"],
  ["#BE123C", "#FDA4AF"],
  ["#B45309", "#FCD34D"],
  ["#0369A1", "#7DD3FC"],
  ["#4D7C0F", "#BEF264"],
  ["#9D174D", "#F9A8D4"],
  ["#4338CA", "#A5B4FC"],
  ["#A21CAF", "#F0ABFC"],
  ["#047857", "#6EE7B7"],
] as const;

function productSvg(index: number) {
  const [dark, light] = colors[index % colors.length];
  const inset = 92 + (index % 4) * 18;
  const spokes = Array.from({ length: 6 }, (_, spoke) => {
    const angle = (Math.PI * 2 * spoke) / 6;
    const x = 600 + Math.cos(angle) * (250 + (index % 3) * 24);
    const y = 600 + Math.sin(angle) * (250 + (index % 3) * 24);
    return `<line x1="600" y1="600" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" rx="140" fill="#F8FAFC"/>
  <circle cx="600" cy="600" r="390" fill="${light}" opacity="0.28"/>
  <g stroke="${dark}" stroke-width="44" stroke-linecap="round">${spokes}</g>
  <rect x="${inset}" y="470" width="${1200 - inset * 2}" height="260" rx="130" fill="${dark}"/>
  <circle cx="600" cy="600" r="170" fill="#FFFFFF" stroke="${dark}" stroke-width="34"/>
  <path d="M520 600h160M600 520v160" stroke="${dark}" stroke-width="30" stroke-linecap="round"/>
</svg>`;
}

function cellValues(product: Record<string, string | boolean>) {
  return BULK_PRODUCT_HEADERS.map((header) => product[header] ?? "");
}

await mkdir(svgDirectory, { recursive: true });
await mkdir(pngDirectory, { recursive: true });

const photoCodes = Array.from({ length: 12 }, (_, index) =>
  `FIXTURE-PHOTO-${String(index + 1).padStart(2, "0")}`,
);
for (const [index, code] of photoCodes.entries()) {
  // Photo 12 deliberately reuses photo 1 bytes to exercise content-hash dedupe.
  const svg = productSvg(index === 11 ? 0 : index);
  await writeFile(path.join(svgDirectory, `${code}.svg`), svg);
  await sharp(Buffer.from(svg))
    .resize(480, 480)
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(pngDirectory, `${code}.png`));
}

const rows: Array<Array<string | boolean>> = [];
let productIndex = 0;
for (const [categoryIndex, category] of categoryDefinitions.entries()) {
  for (const [subcategoryIndex, subcategory] of category.subcategories.entries()) {
    const productCount = 5 + ((categoryIndex * 3 + subcategoryIndex) % 6);
    for (let index = 0; index < productCount; index += 1) {
      productIndex += 1;
      const partCode = `LOCAL-${String(productIndex).padStart(4, "0")}`;
      const assignedPhotos = Array.from({ length: 4 }, (_, offset) =>
        photoCodes[(productIndex + offset * 3) % photoCodes.length],
      );
      rows.push(
        cellValues({
          product_name: `${subcategory} ${index + 1}`,
          part_code: partCode,
          category: category.name,
          subcategory,
          size: `${0.25 + (index % 6) * 0.25} in`,
          material: index % 2 === 0 ? "SS 316" : "Brass",
          type: "Local bulk fixture",
          finish_plating: index % 2 === 0 ? "Natural" : "Nickel plated",
          thread_standard: index % 3 === 0 ? "NPT" : "BSP",
          sealant: "PTFE compatible",
          temperature: "-20 C to 180 C",
          pressure: `${1500 + index * 250} PSI`,
          connections: "Threaded inlet; threaded outlet",
          assemblies: "Body; stem; seals",
          grade: index % 2 === 0 ? "AISI 316" : "C360",
          description: `Generated local fixture for ${subcategory.toLocaleLowerCase()} import validation.`,
          applications: "Oil & gas; Chemical processing; Test benches",
          certifications: "ISO 9001; RoHS",
          additional_notes: "Generated test data; Do not publish to production",
          dimensions: `A=${20 + index} mm|Overall length; B=${12 + index} mm|Body width`,
          photo_codes: assignedPhotos.join("; "),
          is_active: true,
        }),
      );
    }
  }
}

const manifest = {
  headers: [...BULK_PRODUCT_HEADERS],
  rows,
  summary: {
    categories: categoryDefinitions.length,
    distinctImageBytes: 11,
    photoCodes: photoCodes.length,
    products: rows.length,
    subcategories: categoryDefinitions.reduce(
      (total, category) => total + category.subcategories.length,
      0,
    ),
  },
};
await writeFile(
  path.join(outputDirectory, "fixture-data.json"),
  JSON.stringify(manifest, null, 2),
);

console.log(JSON.stringify(manifest.summary));
