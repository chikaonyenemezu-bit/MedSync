import { NextRequest, NextResponse } from 'next/server';
import { searchSNOMEDConcepts } from '@/lib/coding/snomedLookup';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchSNOMEDConcepts(q);
  return NextResponse.json({ results });
}