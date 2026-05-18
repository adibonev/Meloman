import { getTranslations } from "next-intl/server";
import { SOCIAL } from "@/lib/site";

// Share row. Plain anchors so it works without client JS (low risk).
// Facebook = real share dialog. Messenger = mobile deep link (the
// audience is phone-first; desktop Messenger needs an FB app id we
// don't have). Instagram has NO web link-share, so it links to the
// Meloman profile — documented honestly rather than faked.
export async function ShareButtons({ url }: { url: string }) {
  const t = await getTranslations("Share");
  const enc = encodeURIComponent(url);

  const items = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      color: "#1877F2",
      icon: (
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6 4.39 10.97 10.13 11.87v-8.4H7.08v-3.47h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.47h-2.8v8.4C19.61 23.04 24 18.07 24 12.07z" />
      ),
    },
    {
      label: "Messenger",
      href: `fb-messenger://share?link=${enc}`,
      color: "#0084FF",
      icon: (
        <path d="M12 0C5.24 0 0 4.95 0 11.64c0 3.5 1.44 6.53 3.78 8.62.2.18.32.43.32.7l.07 2.15c.02.69.73 1.13 1.36.85l2.4-1.06c.21-.09.45-.11.66-.05 1.1.3 2.27.47 3.41.47 6.76 0 12-4.95 12-11.64C24 4.95 18.76 0 12 0zm7.2 8.93l-3.52 5.6c-.56.89-1.77 1.11-2.62.48l-2.8-2.1a.72.72 0 0 0-.86 0l-3.78 2.87c-.5.38-1.16-.22-.82-.75l3.52-5.6c.56-.89 1.77-1.11 2.62-.48l2.8 2.1c.26.19.6.19.86 0l3.78-2.87c.5-.38 1.16.22.82.75z" />
      ),
    },
    {
      label: "Instagram",
      href: SOCIAL.instagram,
      color: "#E4405F",
      icon: (
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07zM12 6.87a5.13 5.13 0 1 0 0 10.26 5.13 5.13 0 0 0 0-10.26zm0 8.46a3.33 3.33 0 1 1 0-6.66 3.33 3.33 0 0 1 0 6.66zm5.34-8.66a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" />
      ),
    },
  ];

  return (
    <div className="mt-12 flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t("title")}
      </span>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill={it.color}
            aria-hidden
          >
            {it.icon}
          </svg>
          {it.label}
        </a>
      ))}
    </div>
  );
}
