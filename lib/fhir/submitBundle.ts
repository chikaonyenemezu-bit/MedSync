const HAPI_FHIR_BASE = 'https://hapi.fhir.org/baseR4';

export interface FHIRSubmissionResult {
  success: boolean;
  bundleUrl?: string;
  resourceUrls?: Record<string, string>;
  error?: string;
  rawResponse?: unknown;
}

/**
 * Submit a FHIR R4 transaction bundle to the public HAPI FHIR server.
 * Returns the server-assigned URLs for each resource.
 */
export async function submitBundleToHAPI(bundle: object): Promise<FHIRSubmissionResult> {
  try {
    const res = await fetch(HAPI_FHIR_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
      },
      body: JSON.stringify(bundle),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (!res.ok) {
      const issue = data?.issue?.[0]?.diagnostics ?? data?.resourceType ?? 'Unknown error';
      return { success: false, error: `HAPI FHIR ${res.status}: ${issue}` };
    }

    if (data.resourceType !== 'Bundle') {
      return { success: false, error: 'Unexpected response from HAPI FHIR', rawResponse: data };
    }

    // Extract resource URLs from the transaction response
    const resourceUrls: Record<string, string> = {};
    for (const entry of data.entry ?? []) {
      const resourceType = entry.response?.location?.split('/')[0];
      const location = entry.response?.location;
      if (resourceType && location) {
        resourceUrls[resourceType] = `${HAPI_FHIR_BASE}/${location}`;
      }
    }

    return {
      success: true,
      bundleUrl: `${HAPI_FHIR_BASE}/?_id=${data.id}`,
      resourceUrls,
      rawResponse: data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

/**
 * Fetch a previously submitted FHIR resource by URL.
 */
export async function fetchFHIRResource(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/fhir+json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}