const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node load-icd10.js /path/to/icd10gm2025syst_kodes.txt');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Reading:', filePath);
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity
  });

  const rows = [];
  let currentChapter = '', currentChapterTitle = '';
  let currentGroup = '', currentGroupTitle = '';

  for await (const line of rl) {
    if (!line.trim() || line.startsWith('Klassifikationsebene')) continue;
    const cols = line.split('|');
    if (cols.length < 9) continue;

    const level = cols[0]?.trim();
    const chapter = cols[3]?.trim();
    const groupStart = cols[4]?.trim();
    const groupEnd = cols[5]?.trim();
    const codePlain = cols[6]?.trim();
    const codeWithDot = cols[7]?.trim();
    const title = cols[8]?.trim();

    if (!title) continue;

    if (level === 'K') { currentChapter = chapter; currentChapterTitle = title; continue; }
    if (level === 'G') { currentGroup = groupStart && groupEnd ? `${groupStart}-${groupEnd}` : groupStart; currentGroupTitle = title; continue; }
    if (!['3','4','5'].includes(level) || !codePlain || !codeWithDot) continue;

    rows.push({
      code: codeWithDot,
      code_plain: codePlain,
      title,
      chapter: currentChapter,
      chapter_title: currentChapterTitle,
      group_code: currentGroup,
      group_title: currentGroupTitle,
      level: parseInt(level),
      is_billable: level !== '3',
      version: '2025',
    });
  }

  console.log(`Parsed ${rows.length} codes`);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase.from('icd10_gm').upsert(batch, { onConflict: 'code' });
    if (error) console.error('Batch error:', error.message);
    else { inserted += batch.length; process.stdout.write(`\rInserted ${inserted}/${rows.length}...`); }
  }
  console.log(`\nDone. ${inserted} codes loaded.`);
}

main().catch(console.error);