// Renders a schema.org JSON-LD block. Server-rendered into the HTML so
// crawlers (Google, social) pick up structured data. The payload is
// our own, so JSON.stringify is safe to inline.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
