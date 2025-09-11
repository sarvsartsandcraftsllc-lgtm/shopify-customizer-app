// This route is intended to be mapped to a Shopify App Proxy path like /apps/customizer
// In Partner Dashboard > App setup > App proxy:
// Subpath prefix: apps, Subpath: customizer, Proxy URL: https://YOUR_APP_DOMAIN/app/customizer
// Shopify will forward storefront requests to our /app/customizer route.
export { loader, default } from "./app.customizer";




