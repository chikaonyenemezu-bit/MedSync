const ONTOSERVER_BASE = 'https://r4.ontoserver.csiro.au/fhir';
const SNOMED_SYSTEM = 'http://snomed.info/sct';

type FHIRParam = {
  name: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueCoding?: { code: string };
  part?: FHIRParam[];
};

export interface SNOMEDResult {
  conceptId: string;
  display: string;
  fullySpecifiedName: string;
  valid: boolean;
  active: boolean;
}

export interface SNOMEDSearchResult {
  conceptId: string;
  display: string;
  score?: number;
}

export async function validateSNOMEDConcept(conceptId: string): Promise<SNOMEDResult | null> {
  if (!conceptId?.trim()) return null;

  try {
    const url = `${ONTOSERVER_BASE}/CodeSystem/$lookup?system=${encodeURIComponent(SNOMED_SYSTEM)}&code=${conceptId}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/fhir+json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.resourceType !== 'Parameters') return null;

    const params: FHIRParam[] = data.parameter ?? [];

    const display = params.find((p) => p.name === 'display')?.valueString ?? '';

    const designations = params.filter((p) => p.name === 'designation');
    const fsn = designations.find((d) =>
      d.part?.some((part) => part.name === 'use' && part.valueCoding?.code === '900000000000003001')
    );
    const fsnDisplay = fsn?.part?.find((p) => p.name === 'value')?.valueString ?? display;

    const activeParam = params.find((p) =>
      p.name === 'property' &&
      p.part?.some((part) => part.name === 'code' && part.valueString === 'inactive')
    );
    const isInactive =
      activeParam?.part?.find((p) => p.name === 'valueBoolean')?.valueBoolean ?? false;

    return {
      conceptId,
      display,
      fullySpecifiedName: fsnDisplay,
      valid: true,
      active: !isInactive,
    };
  } catch {
    return null;
  }
}

export async function searchSNOMEDConcepts(query: string, limit = 10): Promise<SNOMEDSearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    // ECL: restrict to Clinical Finding (404684003) OR Procedure (71388002) hierarchies only.
    // This blocks rare syndromes, organisms, substances, etc. from polluting clinical intake results.
    const ecl = '<< 404684003 OR << 71388002';
    const valueSetUrl = `${SNOMED_SYSTEM}?fhir_vs=ecl/${encodeURIComponent(ecl)}`;

    const url = `${ONTOSERVER_BASE}/ValueSet/$expand?url=${encodeURIComponent(valueSetUrl)}&filter=${encodeURIComponent(query)}&count=${limit}&activeOnly=true`;

    const res = await fetch(url, {
      headers: { Accept: 'application/fhir+json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const contains: { code: string; display: string; extension?: { valueDecimal?: number }[] }[] =
      data.expansion?.contains ?? [];

    return contains.map((c) => ({
      conceptId: c.code,
      display: c.display,
      score: c.extension?.find((e) => e.valueDecimal !== undefined)?.valueDecimal,
    }));
  } catch {
    return [];
  }
}