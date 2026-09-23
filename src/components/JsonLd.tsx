/**
 * Emits a single JSON-LD script block (TECH-19).
 * Pass one object or an array of objects (each gets its own script).
 */
export function JsonLd({
  data,
}: {
  data: object | object[];
}) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, index) => (
        <script
          // Stable order; content is deterministic per page render.
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
