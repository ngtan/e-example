// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only handle component requests
  if (!request.url.includes('/api/components/')) {
    return NextResponse.next();
  }

  const response = await fetch(request.url);
  
  // Cache the response
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=3600');
  
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export const config = {
  matcher: '/api/components/:path*'
};
