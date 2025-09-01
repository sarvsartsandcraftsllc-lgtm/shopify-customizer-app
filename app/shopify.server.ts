import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { MemorySessionStorage } from "@shopify/shopify-app-remix/server";
// import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
// import getPrismaClient from "./db.server";

// Simplified initialization function to avoid Prisma during build
function createShopifyApp() {
  return shopifyApp({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
    apiVersion: ApiVersion.January25,
    scopes: process.env.SCOPES?.split(","),
    appUrl: process.env.SHOPIFY_APP_URL || "",
    authPathPrefix: "/auth",
    sessionStorage: new MemorySessionStorage(),
    distribution: AppDistribution.AppStore,
    future: {
      unstable_newEmbeddedAuthStrategy: true,
      removeRest: true,
    },
    ...(process.env.SHOP_CUSTOM_DOMAIN
      ? { customShopDomains: [process.env.SHOPIFY_CUSTOM_DOMAIN] }
      : {}),
  });
}

// Only create the app when actually needed
let shopify: ReturnType<typeof createShopifyApp>;
function getShopifyApp() {
  if (!shopify) {
    shopify = createShopifyApp();
  }
  return shopify;
}

export default getShopifyApp;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = (request: Request, responseHeaders: Headers) => getShopifyApp().addDocumentResponseHeaders(request, responseHeaders);
export const authenticate = getShopifyApp().authenticate;
export const unauthenticated = getShopifyApp().unauthenticated;
export const login = getShopifyApp().login;
export const registerWebhooks = getShopifyApp().registerWebhooks;
export const sessionStorage = getShopifyApp().sessionStorage;
