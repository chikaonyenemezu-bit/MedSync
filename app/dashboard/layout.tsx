'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity, LayoutDashboard,
  ClipboardCheck, Share2, ScrollText,
  Plus, ChevronDown, Menu, X,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',                  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/intake/new',       label: 'New intake',   icon: Plus },
  { href: '/dashboard/review',           label: 'Review queue', icon: ClipboardCheck },
  { href: '/dashboard/interoperability', label: 'FHIR center',  icon: Share2 },
  { href: '/dashboard/audit',            label: 'Audit trail',  icon: ScrollText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <>
      <style>{`
        .sidebar-desktop { display: flex; }
        .topbar-mobile { display: none; }
        .drawer-mobile { display: none; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .topbar-mobile { display: flex !important; }
          .drawer-mobile { display: flex !important; }
          .main-content { padding-top: 52px !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── Desktop sidebar ── */}
        <aside className="sidebar-desktop" style={{
          width: 220, flexShrink: 0,
          background: '#0D1B2E',
          flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ padding: '1.25rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1A56A0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' }}>MedSync</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>Clinical Dashboard</div>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '0.75rem 0.5rem' }}>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                fontSize: 13, marginBottom: 2,
                color: isActive(href) ? '#85B7EB' : 'rgba(255,255,255,0.45)',
                background: isActive(href) ? 'rgba(55,138,221,0.15)' : 'transparent',
                fontWeight: isActive(href) ? 500 : 400,
                borderLeft: isActive(href) ? '2px solid #378ADD' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
          <div style={{ padding: '0.875rem 1rem', borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1A56A0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 500, flexShrink: 0 }}>DR</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Dr. Sarah Miller</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Clinical reviewer</div>
            </div>
            <ChevronDown size={14} color="rgba(255,255,255,0.3)" />
          </div>
        </aside>

        {/* ── Mobile topbar ── */}
        <div className="topbar-mobile" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 52, background: '#0D1B2E',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1rem',
          borderBottom: '0.5px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1A56A0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>MedSync</span>
          </div>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 4 }}>
            <Menu size={22} />
          </button>
        </div>

        {/* ── Mobile drawer overlay ── */}
        {mobileOpen && (
          <div className="drawer-mobile" onClick={() => setMobileOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
          }} />
        )}

        {/* ── Mobile drawer ── */}
        <aside className="drawer-mobile" style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 300,
          width: 260, background: '#0D1B2E',
          flexDirection: 'column',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: '#1A56A0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={16} color="#fff" />
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>MedSync</span>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
              <X size={18} />
            </button>
          </div>
          <nav style={{ flex: 1, padding: '0.75rem 0.5rem' }}>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 12px', borderRadius: 8, marginBottom: 2,
                fontSize: 14,
                color: isActive(href) ? '#85B7EB' : 'rgba(255,255,255,0.55)',
                background: isActive(href) ? 'rgba(55,138,221,0.15)' : 'transparent',
                fontWeight: isActive(href) ? 500 : 400,
                borderLeft: isActive(href) ? '2px solid #378ADD' : '2px solid transparent',
              }}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
          <div style={{ padding: '0.875rem 1rem', borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1A56A0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 500 }}>DR</div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Dr. Sarah Miller</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Clinical reviewer</div>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="main-content" style={{
          flex: 1, minWidth: 0,
          background: 'var(--color-background-tertiary)',
          minHeight: '100vh',
        }}>
          {children}
        </main>
      </div>
    </>
  );
}