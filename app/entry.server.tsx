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
  // Get shop parameter from URL for dynamic CSP
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  // CRITICAL: Remove X-Frame-Options BEFORE Shopify adds headers
  responseHeaders.delete("X-Frame-Options");
  
  // Set dynamic CSP based on shop parameter (similar to server middleware approach)
  if (shop) {
    responseHeaders.set("Content-Security-Policy", `frame-ancestors https://${shop} https://admin.shopify.com https://*.myshopify.com;`);
  } else {
    responseHeaders.set("Content-Security-Policy", "frame-ancestors https://admin.shopify.com https://*.myshopify.com;");
  }
  
  addDocumentResponseHeaders(request, responseHeaders);
  
  // FORCE override after Shopify headers - be extremely aggressive
  responseHeaders.delete("X-Frame-Options");
  
  // Re-apply dynamic CSP after Shopify headers
  if (shop) {
    responseHeaders.set("Content-Security-Policy", `frame-ancestors https://${shop} https://admin.shopify.com https://*.myshopify.com;`);
  } else {
    responseHeaders.set("Content-Security-Policy", "frame-ancestors https://admin.shopify.com https://*.myshopify.com;");
  }
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
