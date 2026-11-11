import { NextRequest, NextResponse } from 'next/server';
import { validateSNOMEDConcept } from '@/lib/coding/snomedLookup';

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const conceptId = decodeURIComponent(params.code).trim();

  const result = await validateSNOMEDConcept(conceptId);

  if (!result) {
    return NextResponse.json({ valid: false, conceptId, error: 'Concept not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}