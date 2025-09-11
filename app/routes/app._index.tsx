import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '../shopify.server';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import Customizer from '../components/Customizer';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await authenticate.admin(request);

    const url = new URL(request.url);
    const variantParam = url.searchParams.get('variant') || url.searchParams.get('variantId') || undefined;
    const frontBgParam = url.searchParams.get('frontBg') || undefined;
    const backBgParam = url.searchParams.get('backBg') || undefined;

    let initialBackgroundFront: string | undefined = frontBgParam;
    let initialBackgroundBack: string | undefined = backBgParam;

    // If no explicit backgrounds provided but variant ID is given, try resolving variant image via Admin API
    if (!initialBackgroundFront && variantParam && auth?.admin) {
      try {
        const gid = `gid://shopify/ProductVariant/${variantParam}`;
        const query = `#graphql\nquery VariantImage($id: ID!) { productVariant(id: $id) { image { url } } }`;
        const res = await auth.admin.graphql(query, { variables: { id: gid } });
        const data = await res.json();
        const urlFromVariant: string | undefined = data?.data?.productVariant?.image?.url;
        if (urlFromVariant) {
          initialBackgroundFront = urlFromVariant;
        }
      } catch (err) {
        console.error('Variant image fetch failed:', err);
      }
    }

    return json({
      productId: 'custom-t-shirt',
      variantId: variantParam ?? 'variant-1',
      productTitle: 'Custom T-Shirt',
      initialBackgroundFront,
      initialBackgroundBack,
    });
  } catch (error) {
    console.error('Loader error:', error);
    return json({
      productId: 'custom-t-shirt',
      variantId: 'variant-1',
      productTitle: 'Custom T-Shirt',
    });
  }
};

export default function Index() {
  const { productId, variantId, productTitle, initialBackgroundFront, initialBackgroundBack } = useLoaderData<typeof loader>();

  console.log('App Index component rendering with data:', { productId, variantId, productTitle, initialBackgroundFront, initialBackgroundBack });

  return (
    <Page>
      <TitleBar title="PRNTONDEMAND Customizer" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd" as="h1">
                Customize Your Product
              </Text>
              <Text variant="bodyMd" as="p">
                Design your custom print-on-demand product with our easy-to-use customizer.
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                Debug: Product ID: {productId}, Variant ID: {variantId}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Loading Customizer Component...</Text>
            <Customizer 
              productId={productId}
              variantId={variantId}
              productTitle={productTitle}
              initialBackgroundFront={initialBackgroundFront}
              initialBackgroundBack={initialBackgroundBack}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}