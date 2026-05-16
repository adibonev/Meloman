"use client";

import { motion } from "framer-motion";

/**
 * The correct-answer banner on the host TV. It only mounts when the
 * session flips to `reveal`, so a spring pop on mount reads as "here's
 * the answer" without any extra state. Text is resolved server-side and
 * passed in, keeping i18n off the client.
 */
export function RevealBanner({ text }: { text: string }) {
  return (
    <motion.p
      className="rounded-md bg-foreground/10 px-6 py-3 font-heading text-3xl uppercase tracking-wider"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      {text}
    </motion.p>
  );
}
