import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Test API route that returns basic information
  return json({
    status: "success",
    message: "API is working!",
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get("user-agent"),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasShopifyApiKey: !!process.env.SHOPIFY_API_KEY,
      hasShopifyApiSecret: !!process.env.SHOPIFY_API_SECRET,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    }
  });
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  // Test POST endpoint
  const body = await request.text();
  return json({
    status: "success",
    message: "POST API is working!",
    timestamp: new Date().toISOString(),
    receivedBody: body,
    contentType: request.headers.get("content-type"),
  });
};
