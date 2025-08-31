import { useEffect, useState } from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Badge,
  DataTable,
  EmptyState,
  Icon,
  Tabs,
  LegacyStack,
  Thumbnail,
  ButtonGroup,
  Modal,
  TextField,
  Select,
  Banner,
} from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { authenticate } from '../shopify.server';
import { 
  PrintMajor, 
  ProductsMajor, 
  OrdersMajor, 
  CustomersMajor,
  AnalyticsMajor,
  SettingsMajor 
} from '@shopify/polaris-icons';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Mock data for demonstration - replace with actual API calls
  return {
    stats: {
      totalProducts: 156,
      totalOrders: 89,
      totalCustomers: 234,
      revenue: '$12,450.00'
    },
    recentOrders: [
      { id: '#1001', customer: 'John Doe', status: 'Fulfilled', total: '$89.99' },
      { id: '#1002', customer: 'Jane Smith', status: 'Processing', total: '$124.50' },
      { id: '#1003', customer: 'Bob Johnson', status: 'Shipped', total: '$67.25' }
    ],
    printJobs: [
      { id: 'PJ001', product: 'Custom T-Shirt', status: 'In Progress', priority: 'High' },
      { id: 'PJ002', product: 'Personalized Mug', status: 'Completed', priority: 'Medium' },
      { id: 'PJ003', product: 'Custom Poster', status: 'Queued', priority: 'Low' }
    ]
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get('action');

  if (action === 'createProduct') {
    const color = ['Red', 'Orange', 'Yellow', 'Green'][
      Math.floor(Math.random() * 4)
    ];
    
    const response = await admin.graphql(
      `#graphql
        mutation populateProduct($product: ProductCreateInput!) {
          productCreate(product: $product) {
            product {
              id
              title
              handle
              status
              variants(first: 10) {
                edges {
                  node {
                    id
                    price
                    barcode
                    createdAt
                  }
                }
              }
            }
          }
        }`,
      {
        variables: {
          product: {
            title: `${color} Custom Print Product`,
            productType: 'Print-on-Demand',
            vendor: 'PRNTONDEMAND',
            tags: ['custom', 'print', 'on-demand'],
          },
        },
      },
    );
    
    const responseJson = await response.json();
    const product = responseJson.data!.productCreate!.product!;
    
    return { success: true, product };
  }

  return { success: false };
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    title: '',
    productType: '',
    vendor: 'PRNTONDEMAND'
  });

  const isLoading = ['loading', 'submitting'].includes(fetcher.state) && fetcher.formMethod === 'POST';

  const tabs = [
    {
      id: 'dashboard',
      content: 'Dashboard',
      icon: AnalyticsMajor,
    },
    {
      id: 'products',
      content: 'Products',
      icon: ProductsMajor,
    },
    {
      id: 'orders',
      content: 'Orders',
      icon: OrdersMajor,
    },
    {
      id: 'print-jobs',
      content: 'Print Jobs',
      icon: PrintMajor,
    },
    {
      id: 'customers',
      content: 'Customers',
      icon: CustomersMajor,
    },
    {
      id: 'settings',
      content: 'Settings',
      icon: SettingsMajor,
    },
  ];

  const handleCreateProduct = () => {
    fetcher.submit(
      { action: 'createProduct', ...newProductData },
      { method: 'post' }
    );
    setShowCreateModal(false);
    setNewProductData({ title: '', productType: '', vendor: 'PRNTONDEMAND' });
  };

  const renderDashboard = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Print-on-Demand Dashboard
            </Text>
            <Text variant="bodyMd" as="p">
              Welcome to your PRNTONDEMAND app! Manage your custom print products, orders, and print jobs.
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            Quick Stats
          </Text>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h4">
                  {loaderData.stats.totalProducts}
                </Text>
                <Text variant="bodySm" as="p">
                  Total Products
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h4">
                  {loaderData.stats.totalOrders}
                </Text>
                <Text variant="bodySm" as="p">
                  Total Orders
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h4">
                  {loaderData.stats.totalCustomers}
                </Text>
                <Text variant="bodySm" as="p">
                  Total Customers
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h4">
                  {loaderData.stats.revenue}
                </Text>
                <Text variant="bodySm" as="p">
                  Total Revenue
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </BlockStack>
      </Layout.Section>

      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h3">
                Recent Orders
              </Text>
              <Button variant="plain">View all</Button>
            </InlineStack>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={['Order ID', 'Customer', 'Status', 'Total']}
              rows={loaderData.recentOrders.map(order => [
                order.id,
                order.customer,
                <Badge status={order.status === 'Fulfilled' ? 'success' : order.status === 'Processing' ? 'attention' : 'info'}>
                  {order.status}
                </Badge>,
                order.total
              ])}
            />
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h3">
                Active Print Jobs
              </Text>
              <Button variant="plain">View all</Button>
            </InlineStack>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={['Job ID', 'Product', 'Status', 'Priority']}
              rows={loaderData.printJobs.map(job => [
                job.id,
                job.product,
                <Badge status={job.status === 'Completed' ? 'success' : job.status === 'In Progress' ? 'attention' : 'info'}>
                  {job.status}
                </Badge>,
                <Badge status={job.priority === 'High' ? 'critical' : job.priority === 'Medium' ? 'attention' : 'info'}>
                  {job.priority}
                </Badge>
              ])}
            />
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderProducts = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h2">
                Print-on-Demand Products
              </Text>
              <Button primary onClick={() => setShowCreateModal(true)}>
                Create Product
              </Button>
            </InlineStack>
            <Text variant="bodyMd" as="p">
              Manage your custom print products and templates.
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderOrders = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Orders & Fulfillment
            </Text>
            <Text variant="bodyMd" as="p">
              Track orders and manage print job fulfillment.
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderPrintJobs = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Print Job Management
            </Text>
            <Text variant="bodyMd" as="p">
              Monitor and manage your print production queue.
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderCustomers = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Customer Management
            </Text>
            <Text variant="bodyMd" as="p">
              View customer information and order history.
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderSettings = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              App Settings
            </Text>
            <Text variant="bodyMd" as="p">
              Configure your print-on-demand app settings and integrations.
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 0:
        return renderDashboard();
      case 1:
        return renderProducts();
      case 2:
        return renderOrders();
      case 3:
        return renderPrintJobs();
      case 4:
        return renderCustomers();
      case 5:
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <>
      <TitleBar title="PRNTONDEMAND" />
      <Page>
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
          {renderContent()}
        </Tabs>
      </Page>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Print Product"
        primaryAction={{
          content: 'Create Product',
          onAction: handleCreateProduct,
          loading: isLoading,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowCreateModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Product Title"
              value={newProductData.title}
              onChange={(value) => setNewProductData({ ...newProductData, title: value })}
              placeholder="e.g., Custom T-Shirt"
            />
            <Select
              label="Product Type"
              options={[
                { label: 'T-Shirt', value: 't-shirt' },
                { label: 'Mug', value: 'mug' },
                { label: 'Poster', value: 'poster' },
                { label: 'Hoodie', value: 'hoodie' },
                { label: 'Other', value: 'other' },
              ]}
              value={newProductData.productType}
              onChange={(value) => setNewProductData({ ...newProductData, productType: value })}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      {fetcher.data?.success && (
        <Banner
          title="Product Created Successfully!"
          status="success"
          onDismiss={() => fetcher.data = undefined}
        />
      )}
    </>
  );
}
