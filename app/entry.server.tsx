import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import {
  createReadableStreamFromReadable,
  type EntryContext,
} from "@remix-run/node";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";

export const streamTimeout = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  // Compose a stable allowlist for frame ancestors (storefront + admin)
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const allowlist = [
    "https://admin.shopify.com",
    "https://*.myshopify.com",
    "https://*.shopify.com",
    "https://sarvsartsandcrafts.com",
    "https://www.sarvsartsandcrafts.com",
    "https://1cenkg-zs.myshopify.com",
    "https://1cenkg-zs.account.myshopify.com",
  ];
  if (shop) {
    allowlist.push(`https://${shop}`);
  }

  // Remove X-Frame-Options BEFORE Shopify adds headers
  responseHeaders.delete("X-Frame-Options");
  // Apply CSP with our full allowlist
  responseHeaders.set(
    "Content-Security-Policy",
    `frame-ancestors ${allowlist.join(" ")};`
  );
  
  addDocumentResponseHeaders(request, responseHeaders);
  
  // After Shopify headers, re-apply our CSP and clear X-Frame-Options
  responseHeaders.delete("X-Frame-Options");
  responseHeaders.set(
    "Content-Security-Policy",
    `frame-ancestors ${allowlist.join(" ")};`
  );
  
  // Add CORS headers to prevent CORS errors
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? '')
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
      />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      }
    );

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000);
  });
}
