const ALLOWED_TABLES = new Set([
  "table2.csv",
  "table3.csv",
  "table4.csv",
  "table5.csv",
  "table6.csv",
]);

export default async function handler(request, response) {
  const table = Array.isArray(request.query?.table)
    ? request.query.table[0]
    : request.query?.table;

  if (!ALLOWED_TABLES.has(table)) {
    response.status(404).json({ error: "Unknown postcode table" });
    return;
  }

  try {
    const upstream = await fetch(`https://88zones.com/data/${table}`, {
      headers: { Accept: "text/csv" },
    });

    if (!upstream.ok) {
      response.status(upstream.status).json({ error: "Postcode data is unavailable" });
      return;
    }

    const csv = await upstream.text();
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    response.status(200).send(csv);
  } catch {
    response.status(502).json({ error: "Postcode data could not be loaded" });
  }
}
