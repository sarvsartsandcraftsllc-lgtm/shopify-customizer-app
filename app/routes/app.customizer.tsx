import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Customizer from "../components/Customizer";

// Public-friendly loader. This route will be embedded in a storefront iframe via App Proxy or direct link.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") || undefined;
  const productTitle = url.searchParams.get("productTitle") || undefined;
  const frontBg = url.searchParams.get("frontBg") || undefined;
  const backBg = url.searchParams.get("backBg") || undefined;
  return json({ variant, productTitle, frontBg, backBg });
};

export default function StorefrontCustomizerEmbed() {
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



