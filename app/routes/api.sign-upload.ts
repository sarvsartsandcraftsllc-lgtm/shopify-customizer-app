import { json } from '@remix-run/node';
import { createClient } from '@supabase/supabase-js';
import type { ActionFunction } from '@remix-run/node';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { fileType, fileSize } = body;

    // Validate file type
    if (fileType !== 'png') {
      return json({ error: 'Only PNG files are allowed' }, { status: 400 });
    }

    // Validate file size (30MB limit)
    if (fileSize > 30 * 1024 * 1024) {
      return json({ error: 'File size must be less than 30MB' }, { status: 400 });
    }

    // Generate unique file names
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const previewFileName = `previews/${timestamp}_${randomId}.png`;
    const printFileName = `prints/${timestamp}_${randomId}.png`;

    // Generate signed URLs for uploads
    const { data: previewData, error: previewError } = await supabase.storage
      .from('prints')
      .createSignedUploadUrl(previewFileName, {
        expiresIn: 3600, // 1 hour
      });

    if (previewError) {
      console.error('Preview signed URL error:', previewError);
      return json({ error: 'Failed to generate preview upload URL' }, { status: 500 });
    }

    const { data: printData, error: printError } = await supabase.storage
      .from('prints')
      .createSignedUploadUrl(printFileName, {
        expiresIn: 3600, // 1 hour
      });

    if (printError) {
      console.error('Print signed URL error:', printError);
      return json({ error: 'Failed to generate print upload URL' }, { status: 500 });
    }

    return json({
      previewUrl: previewData.signedUrl,
      printUrl: printData.signedUrl,
      previewFileName,
      printFileName,
    });

  } catch (error) {
    console.error('Sign upload error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

