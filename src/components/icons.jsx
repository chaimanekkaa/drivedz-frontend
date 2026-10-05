export function Icon({ name, size = 18, className = "" }) {
  const s = size, sw = 1.7;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", className };
  switch (name) {
    case "home": return <svg {...common}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" /></svg>;
    case "calendar": return <svg {...common}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>;
    case "pipeline": return <svg {...common}><circle cx="6" cy="7" r="2.4" /><circle cx="12" cy="17" r="2.4" /><circle cx="18" cy="7" r="2.4" /><path d="M8 8.4 16 8.4M6 9.4v3a2 2 0 0 0 2 2h1.5M18 9.4v3a2 2 0 0 1-2 2h-1.5" /></svg>;
    case "settings": return <svg {...common}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.9 2.9l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.6a2.06 2.06 0 1 1-4.12 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.9-2.9l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.4a2.06 2.06 0 1 1 0-4.12h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.9-2.9l.06.06a1.7 1.7 0 0 0 1.87.34H10.6a1.7 1.7 0 0 0 1-1.55V4.4a2.06 2.06 0 1 1 4.12 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.9 2.9l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.6a1.7 1.7 0 0 0 1.55 1h.1a2.06 2.06 0 1 1 0 4.12h-.1a1.7 1.7 0 0 0-1.55 1Z" /></svg>;
    case "logout": return <svg {...common}><path d="M9 21H5.5a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 5.5 3H9" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>;
    case "search": return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></svg>;
    case "check": return <svg {...common}><path d="M4 12.5 9.5 18 20 6.5" /></svg>;
    case "plus": return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "chevron": return <svg {...common}><path d="m9 6 6 6-6 6" /></svg>;
    case "lock": return <svg {...common}><rect x="5.5" y="10.5" width="13" height="9.5" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>;
    case "whatsapp": return <svg {...common}><path d="M7 17.5 4.5 19l1.15-3.3A7.5 7.5 0 1 1 9.2 19.3L7 17.5Z" /><path d="M8.7 8.8c.2-.6.5-.6.8-.6h.5c.2 0 .4 0 .5.4.2.5.6 1.6.6 1.7.1.2 0 .3-.1.5l-.4.5c-.1.2-.2.3-.1.5.2.3.7 1 1.4 1.6.9.8 1.5 1 1.8 1.1.2.1.3.1.5-.1l.5-.6c.1-.2.3-.2.5-.1l1.5.7c.2.1.3.2.3.3 0 .5-.2 1.2-.5 1.5-.3.4-1 .8-1.8.8-1.4 0-3-.7-4.4-2-1.3-1.2-2-2.5-2.2-3.4-.1-.5.1-1.3.4-1.9Z" /></svg>;
    case "map": return <svg {...common}><path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.2" /></svg>;
    case "swap": return <svg {...common}><path d="M4 7h13l-3-3M20 17H7l3 3" /></svg>;
    case "bell": return <svg {...common}><path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 5.5 1.5 5.5h-15S6 13.5 6 9Z" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>;
    case "download": return <svg {...common}><path d="M12 3.5v11M8 11l4 4 4-4" /><path d="M4.5 17.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" /></svg>;
    case "file": return <svg {...common}><path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" /><path d="M14 3.5V8h4" /></svg>;
    case "car": return <svg {...common}><path d="M4 16v-3.2l1.6-4.2A2 2 0 0 1 7.5 7.3h9a2 2 0 0 1 1.9 1.3L20 12.8V16" /><rect x="3" y="16" width="18" height="3.2" rx="1" /><circle cx="7.5" cy="19.4" r="1.3" /><circle cx="16.5" cy="19.4" r="1.3" /></svg>;
    case "wallet": return <svg {...common}><rect x="3.5" y="6.5" width="17" height="12" rx="2.2" /><path d="M16 12.5h2.5" /><path d="M3.5 9.5h17" /></svg>;
    case "building": return <svg {...common}><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M9 16h1.5M13.5 16H15" /></svg>;
    case "x": return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "user": return <svg {...common}><circle cx="12" cy="8.5" r="3.3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>;
    case "trash": return <svg {...common}><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>;
    case "edit": return <svg {...common}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14.5 7.5 3 3" /></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
    case "alert": return <svg {...common}><path d="M12 4 3 19h18L12 4Z" /><path d="M12 10v4M12 17v.5" /></svg>;
    case "key": return <svg {...common}><circle cx="8" cy="15" r="3.5" /><path d="m10.5 12.5 8-8M15 8l2.5 2.5" /></svg>;
    case "chevron-left": return <svg {...common}><path d="m15 6-6 6 6 6" /></svg>;
    default: return null;
  }
}
