import type { ReactNode, SVGProps } from "react";

export type IconName = "arrow" | "back" | "check" | "clock" | "shield" | "plus" | "message" | "calendar" | "camera" | "file" | "logout" | "grid" | "close" | "user" | "chevron" | "microphone" | "stop";
const paths: Record<IconName, ReactNode> = {
  microphone: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
  stop: <rect x="5" y="5" width="14" height="14" rx="2" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  message: <path d="M20 11a8 8 0 0 1-8 8H4l1-4a8 8 0 1 1 15-4ZM8 9h8M8 13h5" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" /></>,
  camera: <><path d="m8 5 2-2h4l2 2h3a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2h3Z" /><circle cx="12" cy="12" r="4" /></>,
  file: <path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h6" />,
  logout: <path d="M9 4H4v16h5m-1-8h13m-5-5 5 5-5 5" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
};

export function Icon({ name, className = "", ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-directional={name === "arrow" || name === "back" || name === "chevron" ? "true" : undefined} className={`ui-icon shrink-0 ${className}`} {...props}>{paths[name]}</svg>;
}

export const controlClass = "form-control";
export const primaryClass = "button button-primary";
export const secondaryClass = "button button-secondary";

export function StatusBadge({ status, children }: { status: string; children: ReactNode }) {
  const tone = status === "high" ? "badge-urgent" : status === "repondu" || status === "cloture" ? "badge-success" : status === "en_cours" || status === "rendez_vous_propose" ? "badge-progress" : "badge-neutral";
  return <span className={`badge ${tone}`}><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />{children}</span>;
}
