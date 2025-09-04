import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { authenticate, login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // If this is a Shopify embedded request, handle authentication here
  if (url.searchParams.get("embedded") && url.searchParams.get("shop")) {
    try {
      // Try to authenticate the request
      await authenticate.admin(request);
      // If successful, redirect to app
      throw redirect(`/app?${url.searchParams.toString()}`);
    } catch (error) {
      // If authentication fails, let Shopify handle the OAuth flow
      // Don't redirect to login, let the authentication error bubble up
      // This will trigger Shopify's OAuth flow
      throw error;
    }
  }

  // If this is a regular Shopify request (has shop param but not embedded), redirect to app route
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export const headers: HeadersFunction = () => {
  return {
    "Content-Security-Policy": "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
    "X-Frame-Options": "",
  };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>PRNTONDEMAND - Custom Print Designer</h1>
        <p className={styles.text}>
          Create custom print-on-demand products with our advanced design tool. Upload images, add text, and design your perfect product.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Custom Design Tool</strong>. Upload images and add text with our professional design interface.
          </li>
          <li>
            <strong>2-Image Limit</strong>. Add up to 2 images on the front of your t-shirt with smart prompts.
          </li>
          <li>
            <strong>Print-Ready Output</strong>. Generate high-quality print files at 300 DPI for professional printing.
          </li>
        </ul>
      </div>
    </div>
  );
}
