"use client";

import {
  CheckIcon,
  PlusIcon,
  SpinnerGapIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { forwardRef, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/shadcn-button";
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
import {
  MAX_METAL_PRICES,
  getMetalDraftError,
  normalizeMetalSymbolInput,
  type MetalDraft,
} from "@/lib/metal-price-rules";
import { invalidateMetalPriceCache } from "@/lib/metal-price-cache";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type MetalPrice = FunctionReturnType<typeof api.metalPrices.list>[number];
type EditorMetalDraft = MetalDraft & {
  id: Id<"metalPrices"> | `new:${string}`;
};
type NewMetalDraft = EditorMetalDraft & { id: `new:${string}` };

const rowEase = [0.22, 1, 0.36, 1] as const;

function draftFromMetal(metal: MetalPrice): EditorMetalDraft {
  return {
    id: metal._id,
    name: metal.name,
    symbol: metal.symbol,
    price: String(metal.price),
  };
}

function createBlankDraft(): EditorMetalDraft {
  return {
    id: `new:${crypto.randomUUID()}`,
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
    return Boolean(draft.name || draft.symbol || draft.price);
  }

  if (!metal) {
    return false;
  }

  return (
    draft.name !== metal.name ||
    draft.symbol !== metal.symbol ||
    draft.price !== String(metal.price)
  );
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

type MetalPriceRowProps = {
  draft: EditorMetalDraft;
  error?: string;
  metal?: MetalPrice;
  onChange: (field: "name" | "symbol" | "price", value: string) => void;
  onDelete: () => void;
  onSave: () => void;
  pending: boolean;
};

const MetalPriceRow = forwardRef<HTMLDivElement, MetalPriceRowProps>(
  function MetalPriceRow(
    { draft, error, metal, onChange, onDelete, onSave, pending },
    ref,
  ) {
    const reduceMotion = useReducedMotion();
    const dirty = isDraftDirty(draft, metal);
    const transition = reduceMotion
      ? { duration: 0 }
      : { duration: 0.2, ease: rowEase };

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
            <InputGroup className="h-10">
              <InputGroupInput
                id={`${draft.id}-name`}
                aria-invalid={Boolean(error)}
                autoComplete="off"
                disabled={pending}
                maxLength={60}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="Metal name"
                value={draft.name}
              />
            </InputGroup>
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
                autoCapitalize="characters"
                autoComplete="off"
                disabled={pending}
                maxLength={2}
                onChange={(event) =>
                  onChange(
                    "symbol",
                    normalizeMetalSymbolInput(event.target.value),
                  )
                }
                placeholder="Symbol"
                value={draft.symbol}
              />
            </InputGroup>
          </Field>

          <Field
            data-invalid={Boolean(error)}
            className="min-w-0 gap-1.5 md:flex-1"
          >
            <FieldLabel className="sr-only" htmlFor={`${draft.id}-price`}>
              Metal price in USD per ton
            </FieldLabel>
            <InputGroup className="h-10">
              <InputGroupInput
                id={`${draft.id}-price`}
                aria-invalid={Boolean(error)}
                disabled={pending}
                inputMode="decimal"
                min="0"
                onChange={(event) => onChange("price", event.target.value)}
                placeholder="0.00"
                step="any"
                type="number"
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
  const prices = useQuery(api.metalPrices.list);
  const createMetal = useMutation(api.metalPrices.create);
  const updateMetal = useMutation(api.metalPrices.update);
  const removeMetal = useMutation(api.metalPrices.remove);
  const [drafts, setDrafts] = useState<EditorMetalDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  const metalsById = useMemo(
    () =>
      new Map<string, MetalPrice>(
        prices?.map((metal) => [metal._id, metal]) ?? [],
      ),
    [prices],
  );

  useEffect(() => {
    if (!prices) {
      return;
    }

    setDrafts((currentDrafts) => {
      const currentById = new Map(
        currentDrafts.map((draft) => [draft.id, draft]),
      );
      const persistedDrafts = prices.map((metal) => {
        const current = currentById.get(metal._id);
        return current && isDraftDirty(current, metal)
          ? current
          : draftFromMetal(metal);
      });
      const newDrafts = currentDrafts.filter(isNewDraft);

      if (persistedDrafts.length === 0 && newDrafts.length === 0) {
        return [createBlankDraft()];
      }

      return [...persistedDrafts, ...newDrafts].slice(0, MAX_METAL_PRICES);
    });
  }, [prices]);

  function setPending(id: string, pending: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function updateDraft(
    id: EditorMetalDraft["id"],
    field: "name" | "symbol" | "price",
    value: string,
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, [field]: value } : draft,
      ),
    );
    setErrors((current) => {
      if (!current[id]) {
        return current;
      }
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
      const input = {
        name: draft.name.trim(),
        symbol: normalizeMetalSymbolInput(draft.symbol),
        price: Number(draft.price),
      };

      const persistedId = getPersistedId(draft);

      if (!persistedId) {
        const id = await createMetal(input);
        setDrafts((current) => [
          ...current.filter((row) => row.id !== draft.id && row.id !== id),
          { ...draft, ...input, price: String(input.price), id },
        ]);
      } else {
        await updateMetal({ id: persistedId, ...input });
      }

      invalidateMetalPriceCache();

      setErrors((current) => {
        const next = { ...current };
        delete next[draft.id];
        return next;
      });
      toast.success(`${input.name} saved.`);
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
    if (!persistedId) {
      return;
    }

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
            Maintain the USD price per ton shown on the homepage. Saved changes
            publish to the public metal cards immediately.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {drafts.length} of {MAX_METAL_PRICES} metals
          </p>
          <Button
            disabled={prices === undefined || drafts.length >= MAX_METAL_PRICES}
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
          <span className="flex-1">Price / ton</span>
          <span className="w-10" aria-hidden="true" />
        </div>

        {prices === undefined ? (
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
                    draft={draft}
                    error={errors[draft.id]}
                    key={draft.id}
                    metal={metalsById.get(getPersistedId(draft) ?? "")}
                    onChange={(field, value) =>
                      updateDraft(draft.id, field, value)
                    }
                    onDelete={() => deleteMetal(draft)}
                    onSave={() => saveMetal(draft)}
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
