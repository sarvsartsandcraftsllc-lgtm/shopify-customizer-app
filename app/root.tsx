import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { HeadersFunction } from "@remix-run/node";

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const headers: HeadersFunction = () => {
  return {
    // Allow embedding inside Shopify Admin (theme editor) and storefront domains
    "Content-Security-Policy":
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com https://*.shopify.com https://sarvsartsandcrafts.com https://www.sarvsartsandcrafts.com https://1cenkg-zs.myshopify.com https://1cenkg-zs.account.myshopify.com;",
    "X-Frame-Options": "ALLOWALL", // Override Vercel's default DENY
  };
};
