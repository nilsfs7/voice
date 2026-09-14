export const metadata = { title: "Imprint" };

export default function ImprintPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="display text-4xl font-semibold">Imprint</h1>
      <div className="card space-y-4 p-6 leading-relaxed text-text-muted whitespace-pre-line">
        {`IMPRINT
General information requirements (§ 5 DDG)

This is a convenience translation. In case of discrepancies, the German version shall prevail.

Provider
Nils Effinghausen (sole proprietor)
Lierstraße 20
80639 Munich

Electronic contact
Email: nils.effinghausen@gmail.com`}
      </div>
    </article>
  );
}
