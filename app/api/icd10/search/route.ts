import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Search by code prefix first (e.g. "R07")
  const isCodeSearch = /^[A-Z]\d/i.test(q);

  let results;

  if (isCodeSearch) {
    // Code prefix search
    const { data, error } = await supabase
      .from('icd10_gm')
      .select('code, code_plain, title, chapter, group_code, level, is_billable')
      .ilike('code', `${q.toUpperCase()}%`)
      .order('code')
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    results = data;
  } else {
    // Full-text search on German title
    const { data, error } = await supabase
      .from('icd10_gm')
      .select('code, code_plain, title, chapter, group_code, level, is_billable')
      .textSearch('title', q, { type: 'websearch', config: 'german' })
      .order('level')
      .limit(20);

    if (error) {
      // Fallback to ilike if full-text search fails
      const { data: fallback, error: fallbackError } = await supabase
        .from('icd10_gm')
        .select('code, code_plain, title, chapter, group_code, level, is_billable')
        .ilike('title', `%${q}%`)
        .order('level')
        .limit(20);

      if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      results = fallback;
    } else {
      results = data;
    }
  }

  return NextResponse.json({ results: results ?? [] });
}