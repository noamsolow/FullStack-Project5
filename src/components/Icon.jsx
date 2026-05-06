const paths = {
  add: <path d="M12 5v14M5 12h14" />,
  arrow_back: <path d="M19 12H5m6-6-6 6 6 6" />,
  article: <path d="M7 4h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Zm3 5h6M10 13h6" />,
  bell: <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Zm-8 5h4" />,
  check: <path d="m5 12 4 4L19 6" />,
  checklist: <path d="m9 7 1.5 1.5L14 5M9 13l1.5 1.5L14 11M5 8h.01M5 14h.01M17 8h2M17 14h2" />,
  chat_bubble: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
  chevron_left: <path d="m15 18-6-6 6-6" />,
  chevron_right: <path d="m9 18 6-6-6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  comment: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
  delete: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4" />,
  file: <path d="M6 3h8l4 4v14H6V3Zm8 0v5h5M9 13h6M9 17h6" />,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />,
  image: <path d="M4 5h16v14H4V5Zm3 11 4-5 3 4 2-3 3 4M8 9h.01" />,
  language: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2-2.2 3-5.2 3-9s-1-6.8-3-9m0 18c-2-2.2-3-5.2-3-9s1-6.8 3-9M3.6 9h16.8M3.6 15h16.8" />,
  link: <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20l1.1-1.1" />,
  location_on: <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  mail: <path d="M4 6h16v12H4V6Zm0 0 8 7 8-7" />,
  more_horiz: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  person: <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />,
  photo_library: <path d="M4 6h12v12H4V6Zm4-4h12v12M7 15l3-4 2 3 1-2 2 3" />,
  plug: <path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7Zm5 9v5" />,
  search: <path d="m21 21-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />,
  share: <path d="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm12-2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM8.7 14.8l6.6-3.6M8.7 18.2l6.6 3.6" />,
  shirt: <path d="M9 4 7 5 3 7l3 5 2-1v9h8v-9l2 1 3-5-4-2-2-1a3 3 0 0 1-6 0Z" />
};

export default function Icon({ name, className = "", size = 24, strokeWidth = 2 }) {
  return (
    <svg
      aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name] || paths.more_horiz}
    </svg>
  );
}
