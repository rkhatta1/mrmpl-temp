"use client";

import {
  ArrowUpIcon,
  CircleNotchIcon,
  ImageIcon,
  NumberCircleTwoIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  AdminCatalogSummary,
  CatalogCategorySummary,
  CatalogProductDetails,
  CatalogProductInput,
  CatalogSubcategorySummary,
} from "@/lib/admin-catalog";
import {
  catalogDimensionsToText,
  catalogListToText,
  parseCatalogDimensions,
  parseCatalogList,
} from "@/lib/admin-catalog";
import { preferOptimizedProductImage } from "@/lib/image-assets";
import {
  createProductImageMediaId,
  moveProductImageToPosition,
} from "@/lib/product-image-contract";
import { optimizeProductImageVariants } from "@/lib/product-image-optimizer";
import { useUploadThing } from "@/lib/uploadthing-client";

function SavingButton({ pending }: { pending: boolean }) {
  return (
    <Button disabled={pending} type="submit">
      {pending ? <CircleNotchIcon className="animate-spin" /> : null}
      Save changes
    </Button>
  );
}

export function CategoryEditor({
  category,
  pending,
  onAddSubcategory,
  onSave,
}: {
  category: CatalogCategorySummary;
  pending: boolean;
  onAddSubcategory: () => void;
  onSave: (value: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);

  useEffect(() => {
    setName(category.name);
    setDescription(category.description);
  }, [category]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name, description });
      }}
    >
      <Card variant="plain">
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          <CardDescription>
            Edit this top-level catalog category or add its first subcategory.
          </CardDescription>
          <CardAction>
            <Button type="button" variant="outline" onClick={onAddSubcategory}>
              <PlusIcon data-icon="inline-start" />
              Add subcategory
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="category-name">Category name</FieldLabel>
              <Input
                id="category-name"
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="category-description">Description</FieldLabel>
              <Textarea
                id="category-description"
                maxLength={2000}
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <SavingButton pending={pending} />
        </CardFooter>
      </Card>
    </form>
  );
}

export function SubcategoryEditor({
  catalog,
  pending,
  subcategory,
  onAddProduct,
  onSave,
}: {
  catalog: AdminCatalogSummary;
  pending: boolean;
  subcategory: CatalogSubcategorySummary;
  onAddProduct: () => void;
  onSave: (value: { name: string; categoryExternalId: string }) => void;
}) {
  const [name, setName] = useState(subcategory.name);
  const [categoryExternalId, setCategoryExternalId] = useState(
    subcategory.categoryExternalId,
  );

  useEffect(() => {
    setName(subcategory.name);
    setCategoryExternalId(subcategory.categoryExternalId);
  }, [subcategory]);

  const selectedCategoryName =
    catalog.categories.find(
      (category) => category.externalId === categoryExternalId,
    )?.name ?? "Select category";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name, categoryExternalId });
      }}
    >
      <Card variant="plain">
        <CardHeader>
          <CardTitle>{subcategory.name}</CardTitle>
          <CardDescription>
            Rename this subcategory, move it to another category, or add a
            product beneath it.
          </CardDescription>
          <CardAction>
            <Button type="button" variant="outline" onClick={onAddProduct}>
              <PlusIcon data-icon="inline-start" />
              Add product
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="subcategory-name">Subcategory name</FieldLabel>
              <Input
                id="subcategory-name"
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={categoryExternalId}
                onValueChange={(value) => {
                  if (value) setCategoryExternalId(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{selectedCategoryName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {catalog.categories.map((category) => (
                      <SelectItem key={category.externalId} value={category.externalId}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <SavingButton pending={pending} />
        </CardFooter>
      </Card>
    </form>
  );
}

const specificationFields: Array<{
  key: keyof Pick<
    CatalogProductInput,
    | "size"
    | "material"
    | "type"
    | "finishPlating"
    | "threadStandard"
    | "sealant"
    | "temperature"
    | "pressure"
    | "connections"
    | "assemblies"
    | "grade"
  >;
  label: string;
}> = [
  { key: "size", label: "Size" },
  { key: "material", label: "Material" },
  { key: "type", label: "Type" },
  { key: "finishPlating", label: "Finish / plating" },
  { key: "threadStandard", label: "Thread standard" },
  { key: "sealant", label: "Sealant" },
  { key: "temperature", label: "Temperature" },
  { key: "pressure", label: "Pressure" },
  { key: "connections", label: "Connections" },
  { key: "assemblies", label: "Assemblies" },
  { key: "grade", label: "Grade" },
];

export function ProductEditor({
  catalog,
  pending,
  product,
  onSave,
}: {
  catalog: AdminCatalogSummary;
  pending: boolean;
  product: CatalogProductDetails;
  onSave: (value: CatalogProductInput) => void;
}) {
  const [draft, setDraft] = useState(product);
  const [applications, setApplications] = useState("");
  const [certifications, setCertifications] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("productImage", {
    onUploadProgress: setUploadProgress,
  });

  useEffect(() => {
    setDraft(product);
    setApplications(catalogListToText(product.applications));
    setCertifications(catalogListToText(product.certifications));
    setAdditionalNotes(catalogListToText(product.additionalNotes));
    setDimensions(catalogDimensionsToText(product.dimensions));
  }, [product]);

  const subcategories = catalog.subcategories.filter(
    (subcategory) => subcategory.categoryExternalId === draft.categoryExternalId,
  );
  const selectedCategoryName =
    catalog.categories.find(
      (category) => category.externalId === draft.categoryExternalId,
    )?.name ?? "Select category";
  const selectedSubcategoryName =
    subcategories.find(
      (subcategory) =>
        subcategory.externalId === draft.subcategoryExternalId,
    )?.name ?? "Select subcategory";

  async function uploadImage(file: File) {
    try {
      setIsOptimizing(true);
      const variants = await optimizeProductImageVariants(file, {
        mediaId: createProductImageMediaId(),
        partCode: draft.partCode,
      });
      setIsOptimizing(false);

      const uploadedFiles = await startUpload(
        variants.map((variant) => variant.file),
      );
      const uploaded = uploadedFiles
        ?.map((uploadedFile) => uploadedFile.serverData)
        .find((serverData) => serverData?.customId?.endsWith("-1080-webp"));
      if (!uploaded?.url) throw new Error("The image upload did not finish.");
      setDraft((current) => ({
        ...current,
        images: [...current.images, uploaded.url],
      }));
      toast.success(
        "Four responsive image variants uploaded. Save changes to publish them.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload the image.",
      );
    } finally {
      setIsOptimizing(false);
      setUploadProgress(0);
    }
  }

  const mediaBusy = isOptimizing || isUploading;

  function moveImage(fromIndex: number, toIndex: number) {
    setDraft((current) => ({
      ...current,
      images: moveProductImageToPosition(
        current.images,
        fromIndex,
        toIndex,
      ),
    }));
  }

  function submit() {
    const { externalId: _externalId, createdAt: _createdAt, ...productInput } =
      draft;
    onSave({
      ...productInput,
      applications: parseCatalogList(applications),
      certifications: parseCatalogList(certifications),
      additionalNotes: parseCatalogList(additionalNotes),
      dimensions: parseCatalogDimensions(dimensions),
    });
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input
        ref={fileInputRef}
        accept="image/avif,image/jpeg,image/png,image/webp"
        className="sr-only"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void uploadImage(file);
        }}
      />

      <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{product.productName}</h2>
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{product.partCode}</p>
        </div>
        <SavingButton pending={pending} />
      </div>

      <Tabs className="min-h-0 flex-1" defaultValue="overview">
        <TabsList className="shrink-0" variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="lists">Lists & dimensions</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card variant="plain">
            <CardHeader className="px-0">
              <CardTitle>Product information</CardTitle>
              <CardDescription>
                Core identity, catalog placement, publication state, and
                customer-facing description.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="product-name">Product name</FieldLabel>
                  <Input
                    id="product-name"
                    maxLength={200}
                    value={draft.productName}
                    onChange={(event) => setDraft({ ...draft, productName: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="product-part-code">Part code</FieldLabel>
                  <Input
                    id="product-part-code"
                    maxLength={120}
                    value={draft.partCode}
                    onChange={(event) => setDraft({ ...draft, partCode: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Category</FieldLabel>
                  <Select
                    value={draft.categoryExternalId}
                    onValueChange={(value) => {
                      if (!value) return;
                      const firstSubcategory = catalog.subcategories.find(
                        (subcategory) => subcategory.categoryExternalId === value,
                      );
                      setDraft({
                        ...draft,
                        categoryExternalId: value,
                        subcategoryExternalId: firstSubcategory?.externalId ?? "",
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{selectedCategoryName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {catalog.categories.map((category) => (
                          <SelectItem key={category.externalId} value={category.externalId}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Subcategory</FieldLabel>
                  <Select
                    value={draft.subcategoryExternalId}
                    onValueChange={(value) => {
                      if (value) setDraft({ ...draft, subcategoryExternalId: value });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{selectedSubcategoryName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {subcategories.map((subcategory) => (
                          <SelectItem key={subcategory.externalId} value={subcategory.externalId}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel htmlFor="product-description">Description</FieldLabel>
                  <Textarea
                    id="product-description"
                    maxLength={10000}
                    rows={8}
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  />
                </Field>
                <Field className="md:col-span-2" orientation="horizontal">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <FieldTitle>Published</FieldTitle>
                    <FieldDescription>Active products can appear on the public catalog.</FieldDescription>
                  </div>
                  <Switch
                    checked={draft.isActive}
                    onCheckedChange={(checked) => setDraft({ ...draft, isActive: checked })}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications">
          <Card variant="plain">
            <CardHeader className="px-0">
              <CardTitle>Technical specifications</CardTitle>
              <CardDescription>
                Values are shown on product cards, detail pages, and comparison
                views when present.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                {specificationFields.map((field) => (
                  <Field key={field.key}>
                    <FieldLabel htmlFor={"product-" + field.key}>{field.label}</FieldLabel>
                    <Input
                      id={"product-" + field.key}
                      maxLength={field.key === "connections" || field.key === "assemblies" ? 2000 : 500}
                      value={draft[field.key]}
                      onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                    />
                  </Field>
                ))}
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card variant="plain">
              <CardHeader className="px-0">
                <CardTitle>Applications & compliance</CardTitle>
                <CardDescription>Enter one item per line.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="product-applications">Applications</FieldLabel>
                    <Textarea id="product-applications" rows={6} value={applications} onChange={(event) => setApplications(event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="product-certifications">Certifications</FieldLabel>
                    <Textarea id="product-certifications" rows={6} value={certifications} onChange={(event) => setCertifications(event.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="product-notes">Additional notes</FieldLabel>
                    <Textarea id="product-notes" rows={6} value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card variant="plain">
              <CardHeader className="px-0">
                <CardTitle>Dimensions</CardTitle>
                <CardDescription>
                  One row per line using Parameter | Value | Optional notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Field>
                  <FieldLabel htmlFor="product-dimensions">Dimension rows</FieldLabel>
                  <Textarea id="product-dimensions" rows={18} value={dimensions} onChange={(event) => setDimensions(event.target.value)} />
                </Field>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="media">
          <Card variant="plain">
            <CardHeader className="px-0">
              <CardTitle>Product media</CardTitle>
              <CardDescription>
                The first image is primary and the second is secondary. Each
                upload is converted to 480, 768, 880, and 1080px WebP variants
                capped at 50 KB before it is sent to UploadThing.
              </CardDescription>
              <CardAction>
                <Button
                  disabled={mediaBusy || draft.images.length >= 12}
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {mediaBusy ? <CircleNotchIcon className="animate-spin" /> : <UploadSimpleIcon data-icon="inline-start" />}
                  {isOptimizing
                    ? "Optimizing variants"
                    : isUploading
                      ? "Uploading " + Math.round(uploadProgress) + "%"
                      : "Upload image"}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              {draft.images.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><ImageIcon /></EmptyMedia>
                    <EmptyTitle>No product images</EmptyTitle>
                    <EmptyDescription>Upload the first image for this product.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button disabled={mediaBusy} type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <UploadSimpleIcon data-icon="inline-start" />
                      Upload image
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {draft.images.map((image, index) => (
                    <Card key={image + "-" + index} size="sm">
                      <div className="aspect-square overflow-hidden bg-muted/50">
                        <img
                          alt={draft.productName + " image " + (index + 1)}
                          className="size-full object-contain"
                          loading="lazy"
                          src={preferOptimizedProductImage(
                            image,
                            draft.partCode,
                            index,
                            "large",
                          )}
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="truncate">Image {index + 1}</CardTitle>
                        {index === 0 ? (
                          <CardAction><Badge>Primary</Badge></CardAction>
                        ) : index === 1 ? (
                          <CardAction><Badge variant="secondary">Secondary</Badge></CardAction>
                        ) : null}
                      </CardHeader>
                      <CardFooter className="justify-end gap-2">
                        {index > 0 ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  aria-label={
                                    "Make image " + (index + 1) + " primary"
                                  }
                                  size="icon-sm"
                                  type="button"
                                  variant="ghost"
                                  onClick={() => moveImage(index, 0)}
                                />
                              }
                            >
                              <ArrowUpIcon />
                            </TooltipTrigger>
                            <TooltipContent>Make primary image</TooltipContent>
                          </Tooltip>
                        ) : null}
                        {draft.images.length > 1 && index !== 1 ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  aria-label={
                                    "Make image " + (index + 1) + " secondary"
                                  }
                                  size="icon-sm"
                                  type="button"
                                  variant="ghost"
                                  onClick={() => moveImage(index, 1)}
                                />
                              }
                            >
                              <NumberCircleTwoIcon />
                            </TooltipTrigger>
                            <TooltipContent>Make secondary image</TooltipContent>
                          </Tooltip>
                        ) : null}
                        <Button
                          aria-label={"Remove image " + (index + 1)}
                          size="icon-sm"
                          type="button"
                          variant="destructive"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              images: current.images.filter(
                                (_, imageIndex) => imageIndex !== index,
                              ),
                            }))
                          }
                        >
                          <TrashIcon />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
