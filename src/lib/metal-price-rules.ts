export const MAX_METAL_PRICES = 6;

export type MetalDraft = {
  id: string;
  name: string;
  symbol: string;
  price: string;
};

export type ExistingMetal = Pick<MetalDraft, "id" | "name" | "symbol">;

function normalizedKey(value: string) {
  return value.trim().toLocaleLowerCase("en");
}

export function normalizeMetalSymbolInput(value: string) {
  return value.trim().toLocaleUpperCase("en").slice(0, 2);
}

export function getMetalDraftError(
  draft: MetalDraft,
  existingMetals: ExistingMetal[],
) {
  const name = draft.name.trim();
  const symbol = normalizeMetalSymbolInput(draft.symbol);
  const price = Number(draft.price);

  if (!name) {
    return "Enter a metal name.";
  }

  if (!symbol) {
    return "Enter a metal symbol.";
  }

  if (!Number.isFinite(price) || price <= 0) {
    return "Enter a price greater than zero.";
  }

  const duplicateName = existingMetals.find(
    (metal) =>
      metal.id !== draft.id &&
      normalizedKey(metal.name) === normalizedKey(name),
  );

  if (duplicateName) {
    return `${duplicateName.name.trim()} is already in the list.`;
  }

  const duplicateSymbol = existingMetals.some(
    (metal) =>
      metal.id !== draft.id &&
      normalizeMetalSymbolInput(metal.symbol) === symbol,
  );

  if (duplicateSymbol) {
    return `The symbol ${symbol} is already in use.`;
  }

  return null;
}
