const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');
const { StringDecoder } = require('string_decoder');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const filePath = process.argv[2];
  console.log('Reading:', filePath);

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity
  });

  const rows = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split(';');
    if (cols.length < 9) continue;

    const level = cols[0]?.trim();
    if (!['3','4','5'].includes(level)) continue;

    const codeWithDot = cols[5]?.trim();
    const codePlain = cols[7]?.trim();
    // Convert Latin-1 characters to proper UTF-8
    const title = Buffer.from(cols[8]?.trim() ?? '', 'latin1').toString('utf8');

    if (!codeWithDot || !codePlain || !title) continue;

    rows.push({
      code: codeWithDot,
      code_plain: codePlain,
      title,
      level: parseInt(level),
      is_billable: level !== '3',
      version: '2025',
    });
  }

  console.log(`Parsed ${rows.length} codes`);

  // Clear existing data first
  console.log('Clearing existing data...');
  await supabase.from('icd10_gm').delete().neq('id', 0);

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
