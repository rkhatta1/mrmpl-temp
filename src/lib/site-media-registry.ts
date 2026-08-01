export type SiteMediaPageId =
  | "home"
  | "about"
  | "capabilities"
  | "buffoli-machines"
  | "one-stop-solution"
  | "iso-9001"
  | "nsf-certified"
  | "lead-free"
  | "custom-assembly"
  | "contract-manufacturing"
  | "in-house-manufacturing"
  | "retail-solutions"
  | "quality"
  | "contact";

export type SiteMediaKind = "image" | "video";

export type SiteMediaAsset = {
  id: string;
  pageId: SiteMediaPageId;
  label: string;
  kind: SiteMediaKind;
  defaultSrc: string;
  posterSrc?: string;
  width: number;
  height: number;
  mutable: boolean;
};

export type SiteMediaPage = {
  id: SiteMediaPageId;
  label: string;
  route: string;
  assets: SiteMediaAsset[];
};

export type SiteMediaOverride = {
  assetId: string;
  url: string;
};

function image(
  pageId: SiteMediaPageId,
  id: string,
  label: string,
  defaultSrc: string,
  width: number,
  height: number,
): SiteMediaAsset {
  return {
    id,
    pageId,
    label,
    kind: "image",
    defaultSrc,
    width,
    height,
    mutable: true,
  };
}

function video(
  pageId: SiteMediaPageId,
  id: string,
  label: string,
  defaultSrc: string,
  posterSrc: string,
  width: number,
  height: number,
): SiteMediaAsset {
  return {
    id,
    pageId,
    label,
    kind: "video",
    defaultSrc,
    posterSrc,
    width,
    height,
    mutable: false,
  };
}

function squareGallery(
  pageId: SiteMediaPageId,
  idPrefix: string,
  labelPrefix: string,
  folder: string,
  fileNumbers: number[],
) {
  return fileNumbers.map((fileNumber, index) =>
    image(
      pageId,
      `${idPrefix}.${index + 1}`,
      `${labelPrefix} ${index + 1}`,
      `/optimized/site/capabilities/${folder}/${fileNumber}-1080.webp`,
      1080,
      1080,
    ),
  );
}

const homeAssets: SiteMediaAsset[] = [
  video(
    "home",
    "home.hero-video",
    "Hero video",
    "/optimized/videos/home-hero.webm",
    "/optimized/videos/home-hero-poster.webp",
    600,
    800,
  ),
  image("home", "home.category.compression", "Compression fitting", "/optimized/home-categories/compression-fitting.webp", 768, 512),
  image("home", "home.category.pipe", "Pipe fitting", "/optimized/home-categories/pipe-fitting.webp", 768, 512),
  image("home", "home.category.flare", "Flare fitting", "/optimized/home-categories/flare-fitting.webp", 768, 512),
  image("home", "home.category.hose-barb", "Hose barb fitting", "/optimized/home-categories/hose-barb-fitting.webp", 472, 354),
  image("home", "home.category.push-on", "Push-on hose barb fitting", "/optimized/home-categories/push-on-hose-barb-fitting.webp", 768, 576),
  image("home", "home.category.garden-hose", "Garden hose fitting", "/optimized/home-categories/garden-hose-fitting.webp", 768, 512),
  image("home", "home.category.bulkhead", "Bulkhead fitting", "/optimized/home-categories/bulkhead-fitting.webp", 768, 512),
  image("home", "home.category.push-in", "Push-in fitting", "/optimized/home-categories/push-in-fitting.webp", 768, 512),
  image("home", "home.category.dot", "DOT fitting", "/optimized/home-categories/dot-fitting.webp", 768, 512),
  image("home", "home.category-fallback", "Category fallback", "/optimized/site/logo-86.webp", 86, 84),
];

const aboutAssets: SiteMediaAsset[] = [
  video(
    "about",
    "about.introduction-video",
    "Introduction video",
    "/optimized/videos/about-us.webm",
    "/optimized/videos/about-us-poster.webp",
    1280,
    720,
  ),
  ...[1, 2, 3, 4, 5].map((number) =>
    image("about", `about.history.${number}`, `History ${number}`, `/optimized/site/about/history-${number}-505.webp`, 505, 300),
  ),
  image("about", "about.history.6", "History 6", "/optimized/site/about/history-6-480.webp", 480, 353),
  image("about", "about.history.7", "History 7", "/optimized/site/about/history-7-1024.webp", 1024, 768),
  image("about", "about.journey", "Company journey", "/optimized/site/journey-1114.webp", 1114, 425),
  image("about", "about.team", "Our team", "/optimized/site/about/team-1600.webp", 1600, 525),
  image("about", "about.csr.education", "CSR education", "/optimized/site/csr/edu-1200.webp", 1200, 1599),
  image("about", "about.csr.health", "CSR healthcare", "/optimized/site/csr/health1-1200.webp", 1200, 900),
];

const capabilitiesAssets: SiteMediaAsset[] = [
  ["buffoli", "Buffoli machines", "Buffoli-1024.webp"],
  ["one-stop", "One-stop solution", "One stop solution-1024.webp"],
  ["iso", "ISO 9001", "ISO-1024.webp"],
  ["nsf", "NSF certified", "NSF-1024.webp"],
  ["lead-free", "Lead free", "Lead free-1024.webp"],
  ["custom", "Custom assembly", "custom compoennts-1024.webp"],
  ["contract", "Contract manufacturing", "Contact manufacturing-1024.webp"],
  ["in-house", "In-house manufacturing", "Inhouse engineering-1024.webp"],
  ["retail", "Retail solutions", "Retail packaging-1024.webp"],
].map(([id, label, filename]) =>
  image(
    "capabilities",
    `capabilities.${id}`,
    label,
    `/optimized/site/capabilities/Landing pages/${filename}`,
    1024,
    768,
  ),
);

const qualityAssets: SiteMediaAsset[] = [
  image("quality", "quality.certificate.iso", "ISO certificate", "/optimized/site/quality/c2-1200.webp", 1200, 1697),
  image("quality", "quality.certificate.nsf", "NSF certificate", "/optimized/site/quality/c1-1200.webp", 1200, 927),
  image("quality", "quality.certificate.iso-14001", "ISO 14001:2015 certificate", "/optimized/site/quality/iso-14001-2015-1200.webp", 1200, 1696),
  image("quality", "quality.certificate.iso-45001", "ISO 45001:2018 certificate", "/optimized/site/quality/iso-45001-2018-1200.webp", 1200, 1696),
  image("quality", "quality.incoming-material", "Incoming material verification", "/optimized/site/quality/new/Incoming material verification-1200.webp", 1200, 670),
  image("quality", "quality.first-piece", "First-piece approval", "/optimized/site/quality/new/first piece approval-1200.webp", 1200, 670),
  image("quality", "quality.in-process", "In-process quality", "/optimized/site/quality/In process quality-1200.webp", 1200, 900),
  image("quality", "quality.receiving", "Receiving inspection", "/optimized/site/quality/new/Receiving inspection report-1200.webp", 1200, 670),
  image("quality", "quality.visual", "Visual examination", "/optimized/site/quality/Visual Examination-1200.webp", 1200, 670),
  image("quality", "quality.pre-dispatch", "Pre-dispatch inspection", "/optimized/site/quality/Pre disptach-1200.webp", 1200, 900),
  image("quality", "quality.gallery.1", "Quality gallery 1", "/optimized/site/quality/new/Gallery-1-1200.webp", 1200, 801),
  image("quality", "quality.gallery.2", "Quality gallery 2", "/optimized/site/quality/new/Gallery-2-1080.webp", 1080, 1080),
  image("quality", "quality.gallery.3", "Quality gallery 3", "/optimized/site/quality/new/gallery-3-1200.webp", 1200, 900),
];

export const SITE_MEDIA_PAGES: SiteMediaPage[] = [
  { id: "home", label: "Home", route: "/", assets: homeAssets },
  { id: "about", label: "About", route: "/about", assets: aboutAssets },
  { id: "capabilities", label: "Capabilities", route: "/capabilities", assets: capabilitiesAssets },
  {
    id: "buffoli-machines",
    label: "Buffoli machines",
    route: "/capabilities/buffoli-machines",
    assets: squareGallery("buffoli-machines", "buffoli", "Buffoli", "Buffoli", [1, 2, 3, 4]),
  },
  {
    id: "one-stop-solution",
    label: "One-stop solution",
    route: "/capabilities/one-stop-solution",
    assets: squareGallery("one-stop-solution", "one-stop", "One-stop solution", "One stop solution", [5, 6, 7, 8]),
  },
  {
    id: "iso-9001",
    label: "ISO 9001",
    route: "/capabilities/iso-9001",
    assets: squareGallery("iso-9001", "iso", "ISO", "ISO", [9, 10, 11, 12]),
  },
  {
    id: "nsf-certified",
    label: "NSF certified",
    route: "/capabilities/nsf-certified",
    assets: squareGallery("nsf-certified", "nsf", "NSF", "NSF", [13, 14, 15, 16]),
  },
  {
    id: "lead-free",
    label: "Lead free",
    route: "/capabilities/lead-free",
    assets: squareGallery("lead-free", "lead-free", "Lead-free", "LeadFree", [17, 18, 19, 20]),
  },
  {
    id: "custom-assembly",
    label: "Custom assembly",
    route: "/capabilities/custom-assembly",
    assets: squareGallery("custom-assembly", "custom", "Custom assembly", "Custom components", [21, 22, 23, 24]),
  },
  {
    id: "retail-solutions",
    label: "Retail solutions",
    route: "/capabilities/retail-solutions",
    assets: squareGallery("retail-solutions", "retail", "Retail solution", "Retail packaging", [25, 26, 27, 28]),
  },
  {
    id: "in-house-manufacturing",
    label: "In-house manufacturing",
    route: "/capabilities/in-house-manufacturing",
    assets: squareGallery("in-house-manufacturing", "in-house", "In-house manufacturing", "Inhouse engineering", [29, 30, 31, 32]),
  },
  {
    id: "contract-manufacturing",
    label: "Contract manufacturing",
    route: "/capabilities/contract-manufacturing",
    assets: squareGallery("contract-manufacturing", "contract", "Contract manufacturing", "Contract manufacturing", [33, 34, 35, 36]),
  },
  { id: "quality", label: "Quality", route: "/quality", assets: qualityAssets },
  {
    id: "contact",
    label: "Contact",
    route: "/contact",
    assets: [
      image("contact", "contact.facility", "Manufacturing facility", "/optimized/site/contact-1600.webp", 1600, 900),
    ],
  },
];

const assets = SITE_MEDIA_PAGES.flatMap((page) => page.assets);
const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
const assetsByDefaultSrc = new Map(
  assets.map((asset) => [asset.defaultSrc, asset]),
);
const pageIds = new Set(SITE_MEDIA_PAGES.map((page) => page.id));

export function isSiteMediaPageId(value: string): value is SiteMediaPageId {
  return pageIds.has(value as SiteMediaPageId);
}

export function getSiteMediaAsset(assetId: string) {
  return assetsById.get(assetId) ?? null;
}

export function getSiteMediaPage(pageId: SiteMediaPageId) {
  return SITE_MEDIA_PAGES.find((page) => page.id === pageId) ?? null;
}

export function validateSiteMediaReplacement({
  assetId,
  mimeType,
  pageId,
}: {
  assetId: string;
  mimeType: string;
  pageId: string;
}) {
  const asset = getSiteMediaAsset(assetId);
  if (!asset || asset.pageId !== pageId) return "Unknown media placement.";
  if (!asset.mutable || asset.kind === "video") return "Video assets are read-only.";
  if (!mimeType.startsWith("image/")) {
    return "Choose an image file for this image placement.";
  }
  return null;
}

export function resolveSiteMediaUrl(
  defaultSrc: string,
  overrides: SiteMediaOverride[],
) {
  const asset = assetsByDefaultSrc.get(defaultSrc);
  if (!asset) return defaultSrc;
  return (
    overrides.find((override) => override.assetId === asset.id)?.url ??
    defaultSrc
  );
}

export function getSiteMediaGridPlacement(width: number, height: number) {
  const ratio =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? width / height
      : 4 / 3;

  return {
    columnSpan: ratio >= 1.6 ? 2 : 1,
    ratio,
  } as const;
}
