import { NextResponse } from 'next/server';
import { getBrandStoryThreadAvailability } from '@/lib/brand-story-threads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getBrandStoryThreadAvailability());
}
