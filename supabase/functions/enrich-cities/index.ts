import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BATCH_SIZE = 50;
const DELAY_MS = 1100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reverseGeocode(lat: number, lon: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MedSync/1.0 (healthcare triage app)" },
  });
  if (!res.ok) return { city: null, postcode: null, state: null };
  const data = await res.json();
  const addr = data.address || {};
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || null;
  return { city, postcode: addr.postcode || null, state: addr.state || null };
}

Deno.serve(async () => {
  const { data: rows, error } = await supabase
    .from("healthcare_providers")
    .select("osm_id, lat, lon")
    .is("addr_city", null)
    .not("lat", "is", null)
    .not("lon", "is", null)
    .limit(BATCH_SIZE);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!rows || rows.length === 0) return new Response(JSON.stringify({ message: "All cities filled." }), { status: 200 });

  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const { city, postcode, state } = await reverseGeocode(row.lat, row.lon);
      if (city) {
        const { error: updateError } = await supabase
          .from("healthcare_providers")
          .update({ addr_city: city, addr_postcode: postcode, state: state })
          .eq("osm_id", row.osm_id);
        if (updateError) { failed++; } else { updated++; }
      } else {
        await supabase.from("healthcare_providers").update({ addr_city: "Unknown" }).eq("osm_id", row.osm_id);
        failed++;
      }
    } catch (err) {
      console.error(`Error processing ${row.osm_id}:`, err);
      failed++;
    }
    await sleep(DELAY_MS);
  }

  return new Response(JSON.stringify({ processed: rows.length, updated, failed, message: "Done. Run again for next batch." }), { status: 200 });
});
