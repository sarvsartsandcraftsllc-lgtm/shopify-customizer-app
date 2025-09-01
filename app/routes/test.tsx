import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";

export const headers: HeadersFunction = () => {
  return {
    "Content-Security-Policy": "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
    "X-Frame-Options": "ALLOWALL",
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // This route bypasses authentication completely
  return { message: "Test route working" };
};

export default function Test() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Test Route - App is Working!</h1>
      <p>If you can see this, the app is loading correctly.</p>
      <p>Current time: {new Date().toISOString()}</p>
      <p>This route bypasses Shopify authentication.</p>
    </div>
  );
}
