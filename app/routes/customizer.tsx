import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Customizer from "../components/Customizer";

// Public storefront route that does NOT require Shopify admin auth
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") || undefined;
  const productTitle = url.searchParams.get("productTitle") || undefined;
  const rawFront = url.searchParams.get("frontBg") || undefined;
  const rawBack = url.searchParams.get("backBg") || undefined;

  const normalize = (src?: string | null) => {
    if (!src) return undefined;
    const trimmed = src.replace(/^['"]|['"]$/g, "");
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    return trimmed;
  };

  const frontBg = normalize(rawFront);
  const backBg = normalize(rawBack);
  return json({ variant, productTitle, frontBg, backBg });
};

export default function StorefrontCustomizer() {
  const { variant, productTitle, frontBg, backBg } = useLoaderData<typeof loader>();
  return (
    <div style={{ padding: 0, margin: 0 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ padding: 12 }}>
          <h2 style={{ margin: 0 }}>{productTitle ?? "Customizer"}</h2>
        </div>
        <Customizer
          initialBackgroundFront={frontBg}
          initialBackgroundBack={backBg}
          variantId={variant}
        />
      </div>
    </div>
  );
}



