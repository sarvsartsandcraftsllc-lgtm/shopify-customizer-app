import React, { useEffect, useState } from 'react';
import { json, type LoaderFunction } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { createClient } from '@supabase/supabase-js';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Badge,
  Stack,
  Text,
  Thumbnail,
  ButtonGroup,
  Modal,
  TextField,
  Banner,
  Spinner,
} from '@shopify/polaris';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DesignOrder {
  id: string;
  order_id: string;
  design_id: string;
  preview_url: string;
  print_url: string;
  notes: string;
  product_id: string;
  variant_id: string;
  product_title: string;
  quantity: number;
  status: 'pending' | 'printed' | 'fulfilled';
  created_at: string;
}

export const loader: LoaderFunction = async () => {
  try {
    const { data: designOrders, error } = await supabase
      .from('design_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch design orders:', error);
      return json({ designOrders: [], error: 'Failed to fetch design orders' });
    }

    return json({ designOrders: designOrders || [] });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ designOrders: [], error: 'Internal server error' });
  }
};

export default function AdminDesigns() {
  const { designOrders, error } = useLoaderData<{ designOrders: DesignOrder[]; error?: string }>();
  const [selectedDesign, setSelectedDesign] = useState<DesignOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'printed' | 'fulfilled'>('printed');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const submit = useSubmit();

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedDesign) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('design_orders')
        .update({ 
          status: modalAction,
          notes: notes || selectedDesign.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDesign.id);

      if (error) {
        throw error;
      }

      // Refresh the page to show updated data
      submit(null, { method: 'get' });
      setIsModalOpen(false);
      setSelectedDesign(null);
      setNotes('');
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open modal for status update
  const openStatusModal = (design: DesignOrder, action: 'printed' | 'fulfilled') => {
    setSelectedDesign(design);
    setModalAction(action);
    setNotes(design.notes || '');
    setIsModalOpen(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge status="attention">Pending</Badge>;
      case 'printed':
        return <Badge status="info">Printed</Badge>;
      case 'fulfilled':
        return <Badge status="success">Fulfilled</Badge>;
      default:
        return <Badge status="warning">Unknown</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Table rows
  const rows = designOrders.map((design) => [
    <Thumbnail
      key={design.id}
      source={design.preview_url}
      alt={design.product_title}
      size="small"
    />,
    design.product_title,
    design.order_id,
    design.design_id.substring(0, 8) + '...',
    design.quantity.toString(),
    getStatusBadge(design.status),
    formatDate(design.created_at),
    <ButtonGroup key={design.id}>
      <Button
        size="slim"
        onClick={() => openStatusModal(design, 'printed')}
        disabled={design.status === 'printed' || design.status === 'fulfilled'}
      >
        Mark Printed
      </Button>
      <Button
        size="slim"
        onClick={() => openStatusModal(design, 'fulfilled')}
        disabled={design.status === 'fulfilled'}
      >
        Mark Fulfilled
      </Button>
      <Button
        size="slim"
        url={design.print_url}
        target="_blank"
        external
      >
        Download
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page title="Design Orders" subtitle="Manage print-on-demand designs">
      <Layout>
        <Layout.Section>
          {error && (
            <Banner status="critical">
              <p>Error: {error}</p>
            </Banner>
          )}

          <Card>
            <DataTable
              columnContentTypes={[
                'text',
                'text',
                'text',
                'text',
                'numeric',
                'text',
                'text',
                'text',
              ]}
              headings={[
                'Preview',
                'Product',
                'Order ID',
                'Design ID',
                'Quantity',
                'Status',
                'Created',
                'Actions',
              ]}
              rows={rows}
              emptyState={
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text variant="bodyMd" as="p">
                    No design orders found
                  </Text>
                  <Text variant="bodyMd" as="p" color="subdued">
                    Design orders will appear here after customers complete their designs
                  </Text>
                </div>
              }
            />
          </Card>
        </Layout.Section>
      </Layout>

      {/* Status Update Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Mark as ${modalAction === 'printed' ? 'Printed' : 'Fulfilled'}`}
        primaryAction={{
          content: `Mark as ${modalAction === 'printed' ? 'Printed' : 'Fulfilled'}`,
          onAction: handleStatusUpdate,
          loading: isUpdating,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setIsModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Stack vertical spacing="tight">
            <Text variant="bodyMd" as="p">
              Are you sure you want to mark this design as{' '}
              <strong>{modalAction === 'printed' ? 'printed' : 'fulfilled'}</strong>?
            </Text>
            
            {selectedDesign && (
              <div>
                <Text variant="bodyMd" as="p">
                  <strong>Product:</strong> {selectedDesign.product_title}
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Order ID:</strong> {selectedDesign.order_id}
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Design ID:</strong> {selectedDesign.design_id}
                </Text>
              </div>
            )}

            <TextField
              label="Notes (optional)"
              value={notes}
              onChange={setNotes}
              placeholder="Add any notes about this status update..."
              multiline={3}
            />
          </Stack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

