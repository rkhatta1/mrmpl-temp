import type { Metadata } from "next";
import { notFound } from "next/navigation";

type AdminSection = {
  description: string;
  nextStep: string;
  title: string;
};

const sections: Record<string, AdminSection> = {
  products: {
    title: "Products",
    description:
      "Manage the product catalog and prepare product imagery for UploadThing-backed workflows.",
    nextStep:
      "Define the product list, search, filters, editing states, and image-upload contract.",
  },
  categories: {
    title: "Categories",
    description:
      "Organize the top-level catalog structure used throughout the public website.",
    nextStep:
      "Define ordering, naming constraints, product counts, and safe deletion behavior.",
  },
  enquiries: {
    title: "Enquiries",
    description:
      "Review contact submissions and the operational state of customer enquiries.",
    nextStep:
      "Define statuses, ownership, response notes, retention, and export requirements.",
  },
};

type AdminSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: AdminSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const currentSection = sections[section];

  return {
    title: currentSection?.title ?? "Admin",
  };
}

export default async function AdminSectionPage({
  params,
}: AdminSectionPageProps) {
  const { section } = await params;
  const currentSection = sections[section];

  if (!currentSection) {
    notFound();
  }

  return (
    <section className="flex flex-1 flex-col">
      <div className="flex max-w-3xl flex-col gap-3">
        <p className="text-sm font-medium text-primary">Module scaffold</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance md:text-3xl">
          {currentSection.title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
          {currentSection.description}
        </p>
      </div>

      <div className="mt-10 border-t pt-6">
        <p className="text-sm font-medium">Next iteration</p>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
          {currentSection.nextStep}
        </p>
      </div>
    </section>
  );
}
