import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {

  // Normalize code — accept R079 or R07.9
  const raw = decodeURIComponent(params.code).toUpperCase().trim();
  const normalized = raw.includes('.')
    ? raw
    : raw.length >= 4
      ? `${raw.slice(0, 3)}.${raw.slice(3)}`
      : raw;

  const { data, error } = await supabase
    .from('icd10_gm')
    .select('code, code_plain, title, chapter, chapter_title, group_code, group_title, level, is_billable, version')
    .or(`code.eq.${normalized},code_plain.eq.${raw}`)
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, code: normalized, error: 'Code not found' }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    code: data.code,
    codePlain: data.code_plain,
    title: data.title,
    chapter: data.chapter,
    chapterTitle: data.chapter_title,
    groupCode: data.group_code,
    groupTitle: data.group_title,
    level: data.level,
    isBillable: data.is_billable,
    version: data.version,
  });
}