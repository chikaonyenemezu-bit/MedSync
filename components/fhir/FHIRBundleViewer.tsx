'use client';

import { useState } from 'react';
import type { FHIRExportRecord } from '@/types/fhir';

interface Props {
  fhirExport: FHIRExportRecord;
}

const RESOURCE_ICONS: Record<string, string> = {
  Patient: '👤',
  Observation: '👁',
  Condition: '📄',
  Encounter: '📅',
  ClinicalImpression: '🩺',
};

export default function FHIRBundleViewer({ fhirExport }: Props) {
  const [copied, setCopied] = useState(false);
  const [selectedResource, setSelectedResource] = useState<number | null>(null);

  const entries = fhirExport.bundle.entry ?? [];

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(fhirExport.bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(fhirExport.bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir-bundle-${fhirExport.intakeId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedEntry = selectedResource !== null ? entries[selectedResource] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Resource list */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1rem', borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Generated resources</span>
          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 999,
            background: '#EAF3DE', color: '#3B6D11', fontWeight: 500,
          }}>
            {entries.length} resources
          </span>
        </div>

        {entries.map((entry, i) => {
          const rt = entry.resource.resourceType;
          const isSelected = selectedResource === i;
          return (
            <div
              key={i}
              onClick={() => setSelectedResource(isSelected ? null : i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 1rem', cursor: 'pointer',
                borderBottom: i < entries.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                background: isSelected ? '#E6F1FB' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{RESOURCE_ICONS[rt] ?? '📦'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{rt}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    {rt}/{entry.resource.id}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#3B6D11' }}>✓</span>
            </div>
          );
        })}
      </div>

      {/* Selected resource JSON */}
      {selectedEntry && (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '0.75rem 1rem', borderBottom: '0.5px solid var(--color-border-tertiary)',
            fontSize: 13, fontWeight: 500,
          }}>
            {selectedEntry.resource.resourceType} resource
          </div>
          <pre style={{
            margin: 0, padding: '1rem',
            fontSize: 11, lineHeight: 1.6,
            fontFamily: 'monospace',
            color: 'var(--color-text-secondary)',
            overflowX: 'auto',
            background: 'var(--color-background-secondary)',
          }}>
            {JSON.stringify(selectedEntry.resource, null, 2)}
          </pre>
        </div>
      )}

      {/* Export actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-secondary)',
            background: 'none', fontSize: 13, cursor: 'pointer',
            color: 'var(--color-text-primary)',
          }}
        >
          {copied ? 'Copied ✓' : 'Copy JSON'}
        </button>
        <button
          onClick={handleDownload}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 'var(--border-radius-md)',
            border: 'none', background: '#1A56A0', color: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Download bundle
        </button>
      </div>
    </div>
  );
}
