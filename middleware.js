import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  
  // Remove X-Frame-Options header to allow iframe embedding
  response.headers.delete('X-Frame-Options');
  
  // Set proper CSP for Shopify domains
  response.headers.set(
    'Content-Security-Policy',
    'frame-ancestors https://admin.shopify.com https://*.myshopify.com;'
  );
  
  return response;
}

export const config = {
  matcher: '/(.*)',
};
