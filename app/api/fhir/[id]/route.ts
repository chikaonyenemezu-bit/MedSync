import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('fhir_exports')
    .select('*')
    .eq('intake_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: 'FHIR export not found' }, { status: 404 });
  }

  return NextResponse.json({ fhirExport: data });
}
