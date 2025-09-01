import { json } from '@remix-run/node';
import { createClient } from '@supabase/supabase-js';
import type { ActionFunction } from '@remix-run/node';
import crypto from 'crypto';

// Supabase client will be initialized in the action function

// Verify Shopify webhook HMAC
function verifyWebhook(data: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Missing SHOPIFY_WEBHOOK_SECRET');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('base64');

  return hash === hmac;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Initialize Supabase client inside the action
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: 'Missing Supabase environment variables' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get the raw body for HMAC verification
    const body = await request.text();
    
    // Get HMAC header
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    
    if (!hmac) {
      console.error('Missing HMAC header');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify webhook signature
    if (!verifyWebhook(body, hmac)) {
      console.error('Invalid HMAC signature');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the webhook data
    const webhookData = JSON.parse(body);
    
    // Check if this is an order creation webhook
    if (webhookData.topic !== 'orders/create') {
      return json({ error: 'Invalid webhook topic' }, { status: 400 });
    }

    const order = webhookData.data;
    const orderId = order.id;
    const lineItems = order.line_items || [];

    // Process line items with design data
    const designOrders = [];

    for (const lineItem of lineItems) {
      const properties = lineItem.properties || [];
      
      // Check if this line item has design data
      const designIdProp = properties.find((prop: any) => prop.name === 'design_id');
      const previewUrlProp = properties.find((prop: any) => prop.name === 'preview_url');
      const printUrlProp = properties.find((prop: any) => prop.name === 'print_url');
      const notesProp = properties.find((prop: any) => prop.name === 'notes');

      if (designIdProp && designIdProp.value) {
        designOrders.push({
          order_id: orderId.toString(),
          design_id: designIdProp.value,
          preview_url: previewUrlProp?.value || '',
          print_url: printUrlProp?.value || '',
          notes: notesProp?.value || '',
          product_id: lineItem.product_id?.toString() || '',
          variant_id: lineItem.variant_id?.toString() || '',
          product_title: lineItem.title || '',
          quantity: lineItem.quantity || 1,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }
    }

    // Insert design orders into Supabase
    if (designOrders.length > 0) {
      const { data, error } = await supabase
        .from('design_orders')
        .insert(designOrders);

      if (error) {
        console.error('Failed to insert design orders:', error);
        return json({ error: 'Failed to store design orders' }, { status: 500 });
      }

      console.log(`Stored ${designOrders.length} design orders for order ${orderId}`);
    }

    return json({ 
      success: true, 
      message: `Processed ${designOrders.length} design orders`,
      orderId 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};



