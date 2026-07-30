export const MAX_METAL_PRICES = 6;

export type MetalDraft = {
  id: string;
  apiCode: string;
  name: string;
  symbol: string;
  price: string;
};

export type ExistingMetal = Pick<
  MetalDraft,
  "id" | "apiCode" | "name" | "symbol"
>;

export function getMetalDraftError(
  draft: MetalDraft,
  existingMetals: ExistingMetal[],
) {
  const price = Number(draft.price);

  if (!draft.apiCode || !draft.name || !draft.symbol) {
    return "Choose a metal from the list.";
  }

  if (!Number.isFinite(price) || price <= 0) {
    return "The latest price is not available yet.";
  }

  const duplicate = existingMetals.find(
    (metal) =>
      metal.id !== draft.id &&
      (metal.apiCode === draft.apiCode || metal.symbol === draft.symbol),
  );

  if (duplicate) {
    return `${duplicate.name.trim()} is already in the list.`;
  }

  return null;
}
