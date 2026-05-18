"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

// Quick "I have a code" entry. Client-side so it can route to the
// dynamic /play/[code] path; the player flow itself stays untouched.
export function JoinCodeEntry({
  placeholder,
  cta,
}: {
  placeholder: string;
  cta: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length >= 4) router.push(`/play/${c}`);
  }

  return (
    <form onSubmit={go} className="flex flex-wrap gap-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder}
        className="min-w-[12rem] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase"
        maxLength={6}
        aria-label={placeholder}
      />
      <button
        type="submit"
        className={buttonVariants({ className: "h-10 px-5 text-sm" })}
      >
        {cta}
      </button>
    </form>
  );
}
