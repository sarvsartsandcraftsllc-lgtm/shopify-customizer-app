import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '../shopify.server';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import Customizer from '../components/Customizer';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);

    // Return basic product data for the customizer
    return json({
      productId: 'custom-t-shirt',
      variantId: 'variant-1',
      productTitle: 'Custom T-Shirt'
    });
  } catch (error) {
    console.error('Loader error:', error);
    // Return basic data even if authentication fails
    return json({
      productId: 'custom-t-shirt',
      variantId: 'variant-1',
      productTitle: 'Custom T-Shirt'
    });
  }
};

export default function Index() {
  // Force cache refresh
  const { productId, variantId, productTitle } = useLoaderData<typeof loader>();

  console.log('App Index component rendering with data:', { productId, variantId, productTitle });

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
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}