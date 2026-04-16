import React from "react";

export type LucideIcon = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function BaseIcon({
  size = 20,
  children,
  viewBox = "0 0 24 24",
  ...props
}: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Activity: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </BaseIcon>
);

export const Ambulance: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M10 17h4" />
    <path d="M3 17V9a2 2 0 0 1 2-2h8l3 4h3a2 2 0 0 1 2 2v4" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
    <path d="M13 7v4h5" />
    <path d="M8 9v4" />
    <path d="M6 11h4" />
  </BaseIcon>
);

export const AlertOctagon: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </BaseIcon>
);

export const CalendarDays: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="8" cy="14" r="1" />
    <circle cx="12" cy="14" r="1" />
    <circle cx="16" cy="14" r="1" />
  </BaseIcon>
);

export const CheckCircle2: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </BaseIcon>
);

export const ClipboardList: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="16" x2="16" y2="16" />
  </BaseIcon>
);

export const FileText: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </BaseIcon>
);

export const LayoutDashboard: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="4" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </BaseIcon>
);

export const MapPin: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M12 22s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.5" />
  </BaseIcon>
);

export const MessageSquare: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 5V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </BaseIcon>
);

export const Receipt: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M4 3h16v18l-2-1.5L16 21l-2-1.5L12 21l-2-1.5L8 21l-2-1.5L4 21z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="13" y2="15" />
  </BaseIcon>
);

export const Search: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16.5" y2="16.5" />
  </BaseIcon>
);

export const ShieldCheck: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </BaseIcon>
);

export const Sparkles: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M5 3v4" />
    <path d="M3 5h4" />
    <path d="M19 16v5" />
    <path d="M16.5 18.5h5" />
  </BaseIcon>
);

export const Stethoscope: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <path d="M4 3v6a4 4 0 0 0 8 0V3" />
    <path d="M8 3v6" />
    <path d="M16 10a3 3 0 1 1 0 6h-2a4 4 0 0 1-4-4" />
    <circle cx="18" cy="13" r="1" />
  </BaseIcon>
);

export const User: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </BaseIcon>
);

export const Video: LucideIcon = (props) => (
  <BaseIcon {...props}>
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="m16 10 6-3v10l-6-3z" />
  </BaseIcon>
);
