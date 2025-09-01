import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
// import { MemorySessionStorage } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import getPrismaClient from "./db.server";

// Lazy initialization function to prevent Prisma and environment variables from being accessed during build
function createShopifyApp() {
  // Validate environment variables before creating the app
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecretKey = process.env.SHOPIFY_API_SECRET;
  const appUrl = process.env.SHOPIFY_APP_URL;
  const scopes = process.env.SCOPES;
  
  if (!apiKey || !apiSecretKey || !appUrl) {
    throw new Error(`Missing required environment variables: SHOPIFY_API_KEY=${!!apiKey}, SHOPIFY_API_SECRET=${!!apiSecretKey}, SHOPIFY_APP_URL=${!!appUrl}`);
  }
  
  // Create a lazy session storage that only initializes Prisma when actually used
  let prismaSessionStorage: PrismaSessionStorage | null = null;
  
  const lazySessionStorage = {
    storeSession: async (session: any) => {
      if (!prismaSessionStorage) {
        prismaSessionStorage = new PrismaSessionStorage(getPrismaClient());
      }
      return prismaSessionStorage.storeSession(session);
    },
    loadSession: async (id: string) => {
      if (!prismaSessionStorage) {
        prismaSessionStorage = new PrismaSessionStorage(getPrismaClient());
      }
      return prismaSessionStorage.loadSession(id);
    },
    deleteSession: async (id: string) => {
      if (!prismaSessionStorage) {
        prismaSessionStorage = new PrismaSessionStorage(getPrismaClient());
      }
      return prismaSessionStorage.deleteSession(id);
    },
    deleteSessions: async (ids: string[]) => {
      if (!prismaSessionStorage) {
        prismaSessionStorage = new PrismaSessionStorage(getPrismaClient());
      }
      return prismaSessionStorage.deleteSessions(ids);
    },
    findSessionsByShop: async (shop: string) => {
      if (!prismaSessionStorage) {
        prismaSessionStorage = new PrismaSessionStorage(getPrismaClient());
      }
      return prismaSessionStorage.findSessionsByShop(shop);
    }
  };
  
  return shopifyApp({
    apiKey,
    apiSecretKey,
    apiVersion: ApiVersion.January25,
    scopes: scopes?.split(","),
    appUrl,
    authPathPrefix: "/auth",
    sessionStorage: lazySessionStorage,
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
