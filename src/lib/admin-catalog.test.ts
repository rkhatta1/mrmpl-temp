import { describe, expect, test } from "bun:test";

import {
  buildCatalogTree,
  filterCatalogTree,
  parseCatalogDimensions,
  parseCatalogList,
} from "./admin-catalog";

describe("admin catalog tree", () => {
  test("maps categories and subcategories to two folder tiers with product files", () => {
    expect(
      buildCatalogTree({
        categories: [
          { externalId: "cat-dot", name: "Dot Fitting", description: "" },
        ],
        subcategories: [
          {
            externalId: "sub-push-on",
            name: "Push On Dot Sleeve",
            categoryExternalId: "cat-dot",
          },
        ],
        products: [
          {
            externalId: "product-34",
            productName: "3/4 Push On Dot Sleeve",
            partCode: "34-PUSH",
            categoryExternalId: "cat-dot",
            subcategoryExternalId: "sub-push-on",
            isActive: true,
          },
        ],
      }),
    ).toEqual([
      {
        id: "category:cat-dot",
        name: "Dot Fitting",
        type: "folder",
        nodeType: "category",
        externalId: "cat-dot",
        children: [
          {
            id: "subcategory:sub-push-on",
            name: "Push On Dot Sleeve",
            type: "folder",
            nodeType: "subcategory",
            externalId: "sub-push-on",
            children: [
              {
                id: "product:product-34",
                name: "3/4 Push On Dot Sleeve",
                type: "file",
                nodeType: "product",
                externalId: "product-34",
                partCode: "34-PUSH",
                isActive: true,
              },
            ],
          },
        ],
      },
    ]);
  });

  test("keeps ancestor folders when a product name or part code matches", () => {
    const tree = buildCatalogTree({
      categories: [
        { externalId: "cat-dot", name: "Dot Fitting", description: "" },
        { externalId: "cat-valve", name: "Valves", description: "" },
      ],
      subcategories: [
        {
          externalId: "sub-sleeve",
          name: "Push On Dot Sleeve",
          categoryExternalId: "cat-dot",
        },
        {
          externalId: "sub-check",
          name: "Check Valve",
          categoryExternalId: "cat-valve",
        },
      ],
      products: [
        {
          externalId: "product-34",
          productName: "3/4 Push On Dot Sleeve",
          partCode: "34-PUSH",
          categoryExternalId: "cat-dot",
          subcategoryExternalId: "sub-sleeve",
          isActive: true,
        },
        {
          externalId: "product-check",
          productName: "Brass Check Valve",
          partCode: "CV-100",
          categoryExternalId: "cat-valve",
          subcategoryExternalId: "sub-check",
          isActive: true,
        },
      ],
    });

    const category = tree[0]!;
    const subcategory = category.children![0]!;
    const product = subcategory.children![0]!;

    expect(filterCatalogTree(tree, "34-push")).toEqual([
      {
        ...category,
        children: [
          {
            ...subcategory,
            children: [product],
          },
        ],
      },
    ]);
  });

  test("normalizes list and dimension textarea values for product mutations", () => {
    expect(parseCatalogList(" Air brake\\n\\nDOT\\nAir brake ")).toEqual([
      "Air brake",
      "DOT",
    ]);
    expect(
      parseCatalogDimensions("OD | 3/4 in | Nominal\\nLength | 1.25 in"),
    ).toEqual([
      { parameter: "OD", value: "3/4 in", notes: "Nominal" },
      { parameter: "Length", value: "1.25 in" },
    ]);
  });
});
