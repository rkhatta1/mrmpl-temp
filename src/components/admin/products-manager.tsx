"use client";

import {
  FolderOpenIcon,
  PackageIcon,
  PlusIcon,
  TreeStructureIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { api } from "../../../convex/_generated/api";
import {
  CategoryEditor,
  ProductEditor,
  SubcategoryEditor,
} from "@/components/admin/catalog-editors";
import { BulkProductUploadDialog } from "@/components/admin/bulk-product-upload-dialog";
import {
  CatalogDeleteDialog,
  CatalogMutationDialog,
} from "@/components/admin/catalog-dialogs";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tree, type TreeViewElement } from "@/components/ui/file-tree";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/shadcn-separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildCatalogTree,
  createEmptyCatalogProduct,
  filterCatalogTree,
  type AdminCatalogSummary,
  type CatalogProductInput,
  type CatalogTreeElement,
} from "@/lib/admin-catalog";

type CatalogNodeType = CatalogTreeElement["nodeType"];

type MutationDialogState = {
  mode: "create" | "rename";
  nodeType: CatalogNodeType;
  target?: CatalogTreeElement;
  categoryExternalId?: string;
  subcategoryExternalId?: string;
};

function findTreeElement(
  elements: CatalogTreeElement[],
  id: string | undefined,
): CatalogTreeElement | undefined {
  if (!id) return undefined;
  for (const element of elements) {
    if (element.id === id) return element;
    const child = findTreeElement(element.children ?? [], id);
    if (child) return child;
  }
  return undefined;
}

function firstSelectableId(elements: CatalogTreeElement[]) {
  return elements[0]?.id;
}

function mutationError(error: unknown) {
  return error instanceof Error ? error.message : "The catalog could not be updated.";
}

function nodeName(nodeType: CatalogNodeType) {
  if (nodeType === "category") return "category";
  if (nodeType === "subcategory") return "subcategory";
  return "product";
}

export function ProductsManager() {
  const catalog = useQuery(api.catalogAdmin.listCatalog, {}) as
    | AdminCatalogSummary
    | undefined;
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<MutationDialogState | null>(null);
  const [dialogName, setDialogName] = useState("");
  const [dialogPartCode, setDialogPartCode] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CatalogTreeElement | null>(null);
  const [pending, setPending] = useState(false);

  const createCategory = useMutation(api.catalogAdmin.createCategory);
  const updateCategory = useMutation(api.catalogAdmin.updateCategory);
  const deleteCategory = useMutation(api.catalogAdmin.deleteCategory);
  const createSubcategory = useMutation(api.catalogAdmin.createSubcategory);
  const updateSubcategory = useMutation(api.catalogAdmin.updateSubcategory);
  const deleteSubcategory = useMutation(api.catalogAdmin.deleteSubcategory);
  const createProduct = useMutation(api.catalogAdmin.createProduct);
  const updateProduct = useMutation(api.catalogAdmin.updateProduct);
  const renameProduct = useMutation(api.catalogAdmin.renameProduct);
  const deleteProduct = useMutation(api.catalogAdmin.deleteProduct);

  const tree = useMemo(() => (catalog ? buildCatalogTree(catalog) : []), [catalog]);
  const filteredTree = useMemo(
    () => filterCatalogTree(tree, search),
    [search, tree],
  );
  const selectedElement = findTreeElement(tree, selectedId);
  const product = useQuery(
    api.catalogAdmin.getProduct,
    selectedElement?.nodeType === "product"
      ? { externalId: selectedElement.externalId }
      : "skip",
  );

  useEffect(() => {
    if (!catalog || selectedElement) return;
    setSelectedId(firstSelectableId(tree));
  }, [catalog, selectedElement, tree]);

  const selectedCategory =
    selectedElement?.nodeType === "category"
      ? catalog?.categories.find(
          (category) => category.externalId === selectedElement.externalId,
        )
      : undefined;
  const selectedSubcategory =
    selectedElement?.nodeType === "subcategory"
      ? catalog?.subcategories.find(
          (subcategory) =>
            subcategory.externalId === selectedElement.externalId,
        )
      : undefined;

  function openCreate(
    nodeType: CatalogNodeType,
    context?: {
      categoryExternalId?: string;
      subcategoryExternalId?: string;
    },
  ) {
    setDialogName("");
    setDialogPartCode("");
    setDialog({ mode: "create", nodeType, ...context });
  }

  function openSiblingCreate(element: CatalogTreeElement) {
    if (element.nodeType === "category") {
      openCreate("category");
      return;
    }
    if (element.nodeType === "subcategory") {
      const subcategory = catalog?.subcategories.find(
        (item) => item.externalId === element.externalId,
      );
      openCreate("subcategory", {
        categoryExternalId: subcategory?.categoryExternalId,
      });
      return;
    }
    const summary = catalog?.products.find(
      (item) => item.externalId === element.externalId,
    );
    openCreate("product", {
      categoryExternalId: summary?.categoryExternalId,
      subcategoryExternalId: summary?.subcategoryExternalId,
    });
  }

  function openRename(element: CatalogTreeElement) {
    setDialogName(element.name);
    setDialogPartCode(element.partCode ?? "");
    setDialog({ mode: "rename", nodeType: element.nodeType, target: element });
  }

  async function submitDialog() {
    if (!dialog) return;
    setPending(true);
    try {
      if (dialog.mode === "create") {
        if (dialog.nodeType === "category") {
          const created = await createCategory({
            name: dialogName,
            description: "",
          });
          setSelectedId("category:" + created.externalId);
        } else if (dialog.nodeType === "subcategory") {
          if (!dialog.categoryExternalId) throw new Error("Choose a category first.");
          const created = await createSubcategory({
            name: dialogName,
            categoryExternalId: dialog.categoryExternalId,
          });
          setSelectedId("subcategory:" + created.externalId);
        } else {
          if (!dialog.categoryExternalId || !dialog.subcategoryExternalId) {
            throw new Error("Choose a subcategory first.");
          }
          const next = createEmptyCatalogProduct(
            dialog.categoryExternalId,
            dialog.subcategoryExternalId,
          );
          const created = await createProduct({
            product: {
              ...next,
              productName: dialogName,
              partCode: dialogPartCode,
            },
          });
          setSelectedId("product:" + created.externalId);
        }
        toast.success("Created " + nodeName(dialog.nodeType) + ".");
      } else if (dialog.target) {
        if (dialog.nodeType === "category") {
          const category = catalog?.categories.find(
            (item) => item.externalId === dialog.target?.externalId,
          );
          await updateCategory({
            externalId: dialog.target.externalId,
            name: dialogName,
            description: category?.description ?? "",
          });
        } else if (dialog.nodeType === "subcategory") {
          const subcategory = catalog?.subcategories.find(
            (item) => item.externalId === dialog.target?.externalId,
          );
          if (!subcategory) throw new Error("The subcategory no longer exists.");
          await updateSubcategory({
            externalId: dialog.target.externalId,
            name: dialogName,
            categoryExternalId: subcategory.categoryExternalId,
          });
        } else {
          await renameProduct({
            externalId: dialog.target.externalId,
            name: dialogName,
          });
        }
        toast.success("Renamed " + nodeName(dialog.nodeType) + ".");
      }
      setDialog(null);
    } catch (error) {
      toast.error(mutationError(error));
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    try {
      if (deleteTarget.nodeType === "category") {
        await deleteCategory({ externalId: deleteTarget.externalId });
      } else if (deleteTarget.nodeType === "subcategory") {
        await deleteSubcategory({ externalId: deleteTarget.externalId });
      } else {
        await deleteProduct({ externalId: deleteTarget.externalId });
      }
      toast.success("Deleted " + nodeName(deleteTarget.nodeType) + ".");
      setDeleteTarget(null);
      setSelectedId(undefined);
    } catch (error) {
      toast.error(mutationError(error));
    } finally {
      setPending(false);
    }
  }

  async function saveCategory(value: { name: string; description: string }) {
    if (!selectedCategory) return;
    setPending(true);
    try {
      await updateCategory({ externalId: selectedCategory.externalId, ...value });
      toast.success("Category saved.");
    } catch (error) {
      toast.error(mutationError(error));
    } finally {
      setPending(false);
    }
  }

  async function saveSubcategory(value: {
    name: string;
    categoryExternalId: string;
  }) {
    if (!selectedSubcategory) return;
    setPending(true);
    try {
      await updateSubcategory({
        externalId: selectedSubcategory.externalId,
        ...value,
      });
      toast.success("Subcategory saved.");
    } catch (error) {
      toast.error(mutationError(error));
    } finally {
      setPending(false);
    }
  }

  async function saveProduct(value: CatalogProductInput) {
    if (!selectedElement || selectedElement.nodeType !== "product") return;
    setPending(true);
    try {
      await updateProduct({ externalId: selectedElement.externalId, product: value });
      toast.success("Product saved.");
    } catch (error) {
      toast.error(mutationError(error));
    } finally {
      setPending(false);
    }
  }

  const dialogNoun = dialog ? nodeName(dialog.nodeType) : "item";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden pb-0">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            Products
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Manage categories, subcategories, product information, and product
            imagery from one catalog workspace.
          </p>
        </div>
        <BulkProductUploadDialog catalog={catalog} />
      </div>

      <div className="mt-8 grid min-h-0 min-w-0 flex-1 grid-rows-[18rem_auto_minmax(0,1fr)] gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-1 lg:gap-9">
        <aside className="relative flex min-h-0 min-w-0 flex-col" aria-label="Product catalog tree">
          <div className="mb-3 flex shrink-0 items-center gap-2">
            <Input
              aria-label="Search catalog"
              placeholder="Search products or part codes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button
              aria-label="Add category"
              size="icon"
              type="button"
              variant="outline"
              onClick={() => openCreate("category")}
            >
              <PlusIcon />
            </Button>
          </div>

          <div className="min-h-0 flex-1">
            {catalog === undefined ? (
              <div className="flex flex-col gap-2 px-2">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </div>
            ) : tree.length === 0 ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><TreeStructureIcon /></EmptyMedia>
                  <EmptyTitle>No catalog structure</EmptyTitle>
                  <EmptyDescription>Create the first category to begin.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button type="button" onClick={() => openCreate("category")}>
                    <PlusIcon data-icon="inline-start" />
                    Add category
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <Tree
                elements={filteredTree as TreeViewElement[]}
                selectedId={selectedId}
                sort="none"
                getCreateLabel={(element) =>
                  "Add " + nodeName((element as CatalogTreeElement).nodeType)
                }
                getDeleteLabel={(element) =>
                  "Delete " + nodeName((element as CatalogTreeElement).nodeType)
                }
                getRenameLabel={(element) =>
                  "Rename " + nodeName((element as CatalogTreeElement).nodeType)
                }
                onCreate={(element) => openSiblingCreate(element as CatalogTreeElement)}
                onDelete={(element) => setDeleteTarget(element as CatalogTreeElement)}
                onRename={(element) => openRename(element as CatalogTreeElement)}
                onSelectedIdChange={setSelectedId}
              />
            )}
          </div>
          <Separator className="absolute top-0 -right-4.5 hidden h-full lg:block" orientation="vertical" />
        </aside>

        <Separator className="lg:hidden" />

        <ScrollArea className="-mr-3 min-h-0 min-w-0 pr-3">
          <div className="pb-20">
            {catalog === undefined ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-80 w-full" />
              </div>
            ) : selectedCategory ? (
              <CategoryEditor
                category={selectedCategory}
                pending={pending}
                onAddSubcategory={() =>
                  openCreate("subcategory", {
                    categoryExternalId: selectedCategory.externalId,
                  })
                }
                onSave={(value) => void saveCategory(value)}
              />
            ) : selectedSubcategory ? (
              <SubcategoryEditor
                catalog={catalog}
                pending={pending}
                subcategory={selectedSubcategory}
                onAddProduct={() =>
                  openCreate("product", {
                    categoryExternalId: selectedSubcategory.categoryExternalId,
                    subcategoryExternalId: selectedSubcategory.externalId,
                  })
                }
                onSave={(value) => void saveSubcategory(value)}
              />
            ) : selectedElement?.nodeType === "product" && product ? (
              <ProductEditor
                catalog={catalog}
                pending={pending}
                product={product}
                onSave={(value) => void saveProduct(value)}
              />
            ) : (
              <Empty className="min-h-80">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    {selectedElement?.nodeType === "product" ? <PackageIcon /> : <FolderOpenIcon />}
                  </EmptyMedia>
                  <EmptyTitle>Select a catalog item</EmptyTitle>
                  <EmptyDescription>
                    Choose a category, subcategory, or product from the file tree.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </ScrollArea>
      </div>

      <CatalogMutationDialog
        description={
          dialog?.mode === "rename"
            ? "Update the name shown throughout the catalog."
            : "Enter the name for the new " + dialogNoun + "."
        }
        name={dialogName}
        nameLabel={dialogNoun.charAt(0).toUpperCase() + dialogNoun.slice(1) + " name"}
        open={dialog !== null}
        partCode={dialogPartCode}
        pending={pending}
        submitLabel={dialog?.mode === "rename" ? "Rename" : "Create"}
        title={(dialog?.mode === "rename" ? "Rename " : "Add ") + dialogNoun}
        onNameChange={setDialogName}
        onOpenChange={(open) => {
          if (!open && !pending) setDialog(null);
        }}
        onPartCodeChange={
          dialog?.mode === "create" && dialog.nodeType === "product"
            ? setDialogPartCode
            : undefined
        }
        onSubmit={() => void submitDialog()}
      />

      <CatalogDeleteDialog
        description={
          deleteTarget?.nodeType === "product"
            ? "This removes the product from the catalog. This action cannot be undone."
            : "This is only allowed after all child records are removed. This action cannot be undone."
        }
        name={deleteTarget?.name ?? ""}
        open={deleteTarget !== null}
        pending={pending}
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => {
          if (!open && !pending) setDeleteTarget(null);
        }}
      />
    </section>
  );
}
