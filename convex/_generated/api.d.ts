/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminAccess from "../adminAccess.js";
import type * as auth from "../auth.js";
import type * as brandTheme from "../brandTheme.js";
import type * as categories from "../categories.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_accessCodeCrypto from "../lib/accessCodeCrypto.js";
import type * as lib_metalsDev from "../lib/metalsDev.js";
import type * as metalPrices from "../metalPrices.js";
import type * as metalsApi from "../metalsApi.js";
import type * as products from "../products.js";
import type * as siteMedia from "../siteMedia.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminAccess: typeof adminAccess;
  auth: typeof auth;
  brandTheme: typeof brandTheme;
  categories: typeof categories;
  contacts: typeof contacts;
  crons: typeof crons;
  http: typeof http;
  "lib/accessCodeCrypto": typeof lib_accessCodeCrypto;
  "lib/metalsDev": typeof lib_metalsDev;
  metalPrices: typeof metalPrices;
  metalsApi: typeof metalsApi;
  products: typeof products;
  siteMedia: typeof siteMedia;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
