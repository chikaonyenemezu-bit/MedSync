import { supabase } from '@/lib/supabase/client';

export interface ICD10Result {
  valid: boolean;
  code: string;
  codePlain: string;
  title: string;
  chapterTitle: string | null;
  groupCode: string | null;
  groupTitle: string | null;
  level: number;
  isBillable: boolean;
  version: string;
}

export async function validateICD10Code(code: string): Promise<ICD10Result | null> {
  if (!code?.trim()) return null;
  const raw = code.replace('.', '').toUpperCase().trim();
  const normalized = raw.length >= 4 ? `${raw.slice(0, 3)}.${raw.slice(3)}` : raw;

  const { data } = await supabase
    .from('icd10_gm')
    .select('code, code_plain, title, chapter_title, group_code, group_title, level, is_billable, version')
    .or(`code.eq.${normalized},code_plain.eq.${raw}`)
    .maybeSingle();

  if (!data) return null;
  return mapRow(data);
}

export async function searchICD10(query: string): Promise<ICD10Result[]> {
  if (!query || query.length < 2) return [];
  const isCodeSearch = /^[A-Z]\d/i.test(query);

  if (isCodeSearch) {
    const { data } = await supabase
      .from('icd10_gm')
      .select('code, code_plain, title, chapter_title, group_code, group_title, level, is_billable, version')
      .ilike('code', `${query.toUpperCase()}%`)
      .order('code')
      .limit(20);
    return (data ?? []).map(mapRow);
  }

  const { data, error } = await supabase
    .from('icd10_gm')
    .select('code, code_plain, title, chapter_title, group_code, group_title, level, is_billable, version')
    .textSearch('title', query, { type: 'websearch', config: 'german' })
    .order('level')
    .limit(20);

  if (error) {
    const { data: fallback } = await supabase
      .from('icd10_gm')
      .select('code, code_plain, title, chapter_title, group_code, group_title, level, is_billable, version')
      .ilike('title', `%${query}%`)
      .order('level')
      .limit(20);
    return (fallback ?? []).map(mapRow);
  }
  return (data ?? []).map(mapRow);
}

function mapRow(d: Record<string, unknown>): ICD10Result {
  return {
    valid: true,
    code: d.code as string,
    codePlain: d.code_plain as string,
    title: d.title as string,
    chapterTitle: d.chapter_title as string | null,
    groupCode: d.group_code as string | null,
    groupTitle: d.group_title as string | null,
    level: d.level as number,
    isBillable: d.is_billable as boolean,
    version: d.version as string,
  };
}
