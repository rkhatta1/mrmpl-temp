"use client";

import {
  CheckIcon,
  PlusIcon,
  SpinnerGapIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { FunctionReturnType } from "convex/server";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { invalidateMetalPriceCache } from "@/lib/metal-price-cache";
import {
  MAX_METAL_PRICES,
  getMetalDraftError,
  type MetalDraft,
} from "@/lib/metal-price-rules";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type AdminMetalData = FunctionReturnType<typeof api.metalsApi.getAdminData>;
type MetalPrice = AdminMetalData["prices"][number];
type CatalogueMetal = AdminMetalData["catalogue"][number];
type EditorMetalDraft = MetalDraft & {
  id: Id<"metalPrices"> | `new:${string}`;
};
type NewMetalDraft = EditorMetalDraft & { id: `new:${string}` };

const rowEase = [0.22, 1, 0.36, 1] as const;

function draftFromMetal(
  metal: MetalPrice,
  catalogue: CatalogueMetal[],
): EditorMetalDraft {
  const source = catalogue.find(
    (candidate) =>
      candidate.apiCode === metal.apiCode || candidate.symbol === metal.symbol,
  );

  return {
    id: metal._id,
    apiCode: source?.apiCode ?? metal.apiCode ?? "",
    name: source?.name ?? metal.name,
    symbol: source?.symbol ?? metal.symbol,
    price: String(metal.price),
  };
}

function createBlankDraft(): EditorMetalDraft {
  return {
    id: `new:${crypto.randomUUID()}`,
    apiCode: "",
    name: "",
    symbol: "",
    price: "",
  };
}

function isNewDraft(draft: EditorMetalDraft): draft is NewMetalDraft {
  return draft.id.startsWith("new:");
}

function getPersistedId(draft: EditorMetalDraft) {
  return isNewDraft(draft) ? null : (draft.id as Id<"metalPrices">);
}

function isDraftDirty(draft: EditorMetalDraft, metal?: MetalPrice) {
  if (isNewDraft(draft)) {
    return Boolean(draft.apiCode);
  }

  if (!metal) {
    return false;
  }

  return draft.apiCode !== (metal.apiCode ?? "");
}

function getMutationError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "string"
  ) {
    return error.data;
  }

  return error instanceof Error ? error.message : "Unable to save this metal.";
}

function formatDateTime(value: number | null) {
  return value === null
    ? "Not synced yet"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value);
}

type MetalPriceRowProps = {
  catalogue: CatalogueMetal[];
  draft: EditorMetalDraft;
  drafts: EditorMetalDraft[];
  error?: string;
  metal?: MetalPrice;
  onDelete: () => void;
  onSave: () => void;
  onSelect: (metal: CatalogueMetal | null) => void;
  pending: boolean;
};

const MetalPriceRow = forwardRef<HTMLDivElement, MetalPriceRowProps>(
  function MetalPriceRow(
    {
      catalogue,
      draft,
      drafts,
      error,
      metal,
      onDelete,
      onSave,
      onSelect,
      pending,
    },
    ref,
  ) {
    const reduceMotion = useReducedMotion();
    const dirty = isDraftDirty(draft, metal);
    const transition = reduceMotion
      ? { duration: 0 }
      : { duration: 0.2, ease: rowEase };
    const catalogueNames = catalogue.map((item) => item.name);

    return (
      <motion.div
        ref={ref}
        layout
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={
          reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }
        }
        transition={transition}
        className="rounded-lg border bg-background p-3"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <Field
            data-invalid={Boolean(error)}
            className="gap-1.5 md:basis-[34%] md:shrink-0"
          >
            <FieldLabel className="sr-only" htmlFor={`${draft.id}-name`}>
              Metal name
            </FieldLabel>
            <Combobox
              autoHighlight
              disabled={pending || catalogue.length === 0}
              items={catalogueNames}
              onValueChange={(name) => {
                const selected = catalogue.find((item) => item.name === name);
                onSelect(selected ?? null);
              }}
              value={draft.name || null}
            >
              <ComboboxInput
                id={`${draft.id}-name`}
                aria-invalid={Boolean(error)}
                className="h-10 w-full"
                placeholder="Select metal"
              />
              <ComboboxContent>
                <ComboboxEmpty>No metals found.</ComboboxEmpty>
                <ComboboxList>
                  {(name) => {
                    const item = catalogue.find(
                      (metalItem) => metalItem.name === name,
                    );
                    if (!item) return null;

                    const duplicate = drafts.some(
                      (row) =>
                        row.id !== draft.id && row.apiCode === item.apiCode,
                    );
                    return (
                      <ComboboxItem
                        disabled={duplicate || item.price === null}
                        key={item.apiCode}
                        value={name}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="ml-auto pr-5 text-muted-foreground">
                          {item.symbol}
                        </span>
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <Field
            data-invalid={Boolean(error)}
            className="gap-1.5 md:basis-[18%] md:shrink-0"
          >
            <FieldLabel className="sr-only" htmlFor={`${draft.id}-symbol`}>
              Metal symbol
            </FieldLabel>
            <InputGroup className="h-10">
              <InputGroupInput
                id={`${draft.id}-symbol`}
                aria-invalid={Boolean(error)}
                aria-readonly="true"
                placeholder="Symbol"
                readOnly
                value={draft.symbol}
              />
            </InputGroup>
          </Field>

          <Field
            data-invalid={Boolean(error)}
            className="min-w-0 gap-1.5 md:flex-1"
          >
            <FieldLabel className="sr-only" htmlFor={`${draft.id}-price`}>
              Metal price in USD per metric tonne
            </FieldLabel>
            <InputGroup className="h-10">
              <InputGroupInput
                id={`${draft.id}-price`}
                aria-invalid={Boolean(error)}
                aria-readonly="true"
                placeholder="Awaiting daily sync"
                readOnly
                value={draft.price}
              />
              <InputGroupAddon align="inline-start">
                <InputGroupText>USD</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <motion.div
            layout
            transition={transition}
            className="flex shrink-0 items-center justify-end gap-2"
          >
            <AnimatePresence initial={false}>
              {dirty ? (
                <motion.div
                  key="save"
                  initial={
                    reduceMotion ? false : { opacity: 0, width: 0, x: 16 }
                  }
                  animate={{ opacity: 1, width: 40, x: 0 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, width: 0, x: 16 }
                  }
                  transition={transition}
                  className="overflow-hidden"
                >
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label={`Save ${draft.name || "metal"}`}
                          className="size-10"
                          disabled={pending}
                          onClick={onSave}
                          size="icon-lg"
                          type="button"
                          variant="outline"
                        />
                      }
                    >
                      {pending ? (
                        <SpinnerGapIcon className="animate-spin" />
                      ) : (
                        <CheckIcon />
                      )}
                    </TooltipTrigger>
                    <TooltipContent>Save metal</TooltipContent>
                  </Tooltip>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={`Delete ${draft.name || "metal row"}`}
                    className="size-10"
                    disabled={pending}
                    onClick={onDelete}
                    size="icon-lg"
                    type="button"
                    variant="destructive"
                  />
                }
              >
                <TrashIcon />
              </TooltipTrigger>
              <TooltipContent>Delete metal</TooltipContent>
            </Tooltip>
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {error ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={transition}
              className="overflow-hidden"
            >
              <FieldError className="pt-2">{error}</FieldError>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    );
  },
);

function MetalPricesSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading metal prices">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton className="h-16 w-full rounded-lg" key={index} />
      ))}
    </div>
  );
}

export function MetalPricesEditor() {
  const reduceMotion = useReducedMotion();
  const month = new Date().toISOString().slice(0, 7);
  const adminData = useQuery(api.metalsApi.getAdminData, { month });
  const syncPrices = useAction(api.metalsApi.syncNow);
  const createMetal = useMutation(api.metalPrices.create);
  const updateMetal = useMutation(api.metalPrices.update);
  const removeMetal = useMutation(api.metalPrices.remove);
  const [drafts, setDrafts] = useState<EditorMetalDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const syncRequested = useRef(false);

  const prices = adminData?.prices;
  const catalogue = useMemo(
    () => adminData?.catalogue ?? [],
    [adminData?.catalogue],
  );
  const metalsById = useMemo(
    () =>
      new Map<string, MetalPrice>(
        prices?.map((metal) => [metal._id, metal]) ?? [],
      ),
    [prices],
  );

  useEffect(() => {
    if (!adminData || syncRequested.current) return;

    const hasDailyPrices = adminData.catalogue.every(
      (metal) => metal.price !== null,
    );
    if (hasDailyPrices || adminData.usage.status === "syncing") return;

    syncRequested.current = true;
    void syncPrices({}).catch((error) => toast.error(getMutationError(error)));
  }, [adminData, syncPrices]);

  useEffect(() => {
    if (!prices) return;

    setDrafts((currentDrafts) => {
      const currentById = new Map(
        currentDrafts.map((draft) => [draft.id, draft]),
      );
      const persistedDrafts = prices.map((metal) => {
        const current = currentById.get(metal._id);
        return current && isDraftDirty(current, metal)
          ? current
          : draftFromMetal(metal, catalogue);
      });
      const newDrafts = currentDrafts.filter(isNewDraft);

      if (persistedDrafts.length === 0 && newDrafts.length === 0) {
        return [createBlankDraft()];
      }

      return [...persistedDrafts, ...newDrafts].slice(0, MAX_METAL_PRICES);
    });
  }, [catalogue, prices]);

  function setPending(id: string, pending: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function selectMetal(
    id: EditorMetalDraft["id"],
    metal: CatalogueMetal | null,
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id
          ? {
              ...draft,
              apiCode: metal?.apiCode ?? "",
              name: metal?.name ?? "",
              symbol: metal?.symbol ?? "",
              price:
                metal?.price === null || metal === null
                  ? ""
                  : String(metal.price),
            }
          : draft,
      ),
    );
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function addMetal() {
    if (drafts.length >= MAX_METAL_PRICES) {
      toast.error("You can add up to six metals.");
      return;
    }

    setDrafts((current) => [...current, createBlankDraft()]);
  }

  async function saveMetal(draft: EditorMetalDraft) {
    const error = getMetalDraftError(draft, drafts);
    if (error) {
      setErrors((current) => ({ ...current, [draft.id]: error }));
      toast.error(error);
      return;
    }

    setPending(draft.id, true);

    try {
      const persistedId = getPersistedId(draft);

      if (!persistedId) {
        const id = await createMetal({ apiCode: draft.apiCode });
        setDrafts((current) => [
          ...current.filter((row) => row.id !== draft.id && row.id !== id),
          { ...draft, id },
        ]);
      } else {
        await updateMetal({ id: persistedId, apiCode: draft.apiCode });
      }

      invalidateMetalPriceCache();
      setErrors((current) => {
        const next = { ...current };
        delete next[draft.id];
        return next;
      });
      toast.success(`${draft.name} saved.`);
    } catch (mutationError) {
      const message = getMutationError(mutationError);
      setErrors((current) => ({ ...current, [draft.id]: message }));
      toast.error(message);
    } finally {
      setPending(draft.id, false);
    }
  }

  async function deleteMetal(draft: EditorMetalDraft) {
    const index = drafts.findIndex((row) => row.id === draft.id);
    setDrafts((current) => current.filter((row) => row.id !== draft.id));
    setErrors((current) => {
      const next = { ...current };
      delete next[draft.id];
      return next;
    });

    const persistedId = getPersistedId(draft);
    if (!persistedId) return;

    setPending(draft.id, true);

    try {
      await removeMetal({ id: persistedId });
      invalidateMetalPriceCache();
      toast.success(`${draft.name} deleted.`);
    } catch (mutationError) {
      const message = getMutationError(mutationError);
      setDrafts((current) => {
        const next = [...current];
        next.splice(Math.max(index, 0), 0, draft);
        return next;
      });
      setErrors((current) => ({ ...current, [draft.id]: message }));
      toast.error(message);
    } finally {
      setPending(draft.id, false);
    }
  }

  return (
    <section className="flex flex-1 flex-col">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            Metal prices
          </h1>
          <p className="text-base leading-7 text-muted-foreground text-pretty">
            Choose which daily metals.dev prices appear on the homepage. Prices
            are read-only and refresh from Convex once per day.
          </p>
          {adminData ? (
            <div
              className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
              aria-live="polite"
            >
              <p>
                API requests: {adminData.usage.count} of {adminData.usage.limit}{" "}
                this month
              </p>
              <p>{adminData.usage.remaining} remaining</p>
              <p>Last sync: {formatDateTime(adminData.usage.lastSuccessAt)}</p>
              {adminData.usage.error ? (
                <p className="text-destructive">{adminData.usage.error}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {drafts.length} of {MAX_METAL_PRICES} metals
          </p>
          <Button
            disabled={
              adminData === undefined ||
              catalogue.some((metal) => metal.price === null) ||
              drafts.length >= MAX_METAL_PRICES
            }
            onClick={addMetal}
            size="lg"
            type="button"
          >
            <PlusIcon data-icon="inline-start" />
            Add metal
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col pt-6">
        <div className="mb-2 hidden gap-3 px-3 text-xs font-medium text-muted-foreground md:flex">
          <span className="basis-[34%] shrink-0">Metal name</span>
          <span className="basis-[18%] shrink-0">Symbol</span>
          <span className="flex-1">Price / metric tonne</span>
          <span className="w-10" aria-hidden="true" />
        </div>

        {adminData === undefined ? (
          <MetalPricesSkeleton />
        ) : (
          <LayoutGroup>
            <motion.div
              layout
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.2, ease: rowEase }
              }
              className="relative flex w-full flex-col gap-3"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {drafts.map((draft) => (
                  <MetalPriceRow
                    catalogue={catalogue}
                    draft={draft}
                    drafts={drafts}
                    error={errors[draft.id]}
                    key={draft.id}
                    metal={metalsById.get(getPersistedId(draft) ?? "")}
                    onDelete={() => deleteMetal(draft)}
                    onSave={() => saveMetal(draft)}
                    onSelect={(metal) => selectMetal(draft.id, metal)}
                    pending={pendingIds.has(draft.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </div>
    </section>
  );
}
