import { readFile, writeFile } from "node:fs/promises";

const sourceFiles = [1, 2, 3, 4, 5, 6].map((number) =>
  new URL(`../src/data/source/table${number}.csv`, import.meta.url),
);
const stateCodes = {
  "New South Wales": "NSW",
  "Northern Territory": "NT",
  Queensland: "QLD",
  Victoria: "VIC",
  "South Australia": "SA",
  Tasmania: "TAS",
  "Western Australia": "WA",
  "Australian Capital Territory (ACT)": "ACT",
  "Norfolk Island": "NI",
};
const allPostcodeRanges = { NT: [800, 999], ACT: [200, 299], SA: [5000, 5999], TAS: [7000, 7999], NI: [2899, 2899] };
const eligibleCodes = new Set();

for (const sourceFile of sourceFiles) {
  const [, ...rows] = (await readFile(sourceFile, "utf8")).trim().split(/\r?\n/);
  rows.forEach((row) => {
    const commaIndex = row.indexOf(",");
    const state = stateCodes[row.slice(0, commaIndex).trim()];
    const values = row.slice(commaIndex + 1).trim().replace(/^"|"$/g, "");
    if (/all postcodes|all areas/i.test(values)) {
      const [start, end] = allPostcodeRanges[state] || [];
      if (start) for (let code = start; code <= end; code += 1) eligibleCodes.add(String(code).padStart(4, "0"));
      return;
    }
    values.split(",").forEach((code) => eligibleCodes.add(code.trim().padStart(4, "0")));
  });
}

const candidateCodes = [...eligibleCodes];
const directoryChunks = Array.from(
  { length: Math.ceil(candidateCodes.length / 350) },
  (_, index) => candidateCodes.slice(index * 350, index * 350 + 350),
);
const directoryResults = await Promise.all(directoryChunks.map(async (chunk) => {
  const body = new URLSearchParams({
    where: `POA_CODE_2021 IN (${chunk.map((code) => `'${code}'`).join(",")})`,
    outFields: "POA_CODE_2021",
    returnGeometry: "false",
    f: "json",
  });
  const directoryResponse = await fetch(
    "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/MapServer/0/query",
    { method: "POST", body },
  );
  if (!directoryResponse.ok) throw new Error("Could not verify Australian postcode boundaries");
  return directoryResponse.json();
}));
const verifiedCodes = new Set(directoryResults.flatMap((result) =>
  (result.features || []).map((feature) => String(
    feature.attributes?.poa_code_2021 || feature.attributes?.POA_CODE_2021 || "",
  ).padStart(4, "0")),
));

const response = await fetch("https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.csv");
if (!response.ok) throw new Error("Could not download Australian postcode locality data");
const localitiesByCode = new Map();
(await response.text()).split(/\r?\n/).slice(1).forEach((row) => {
  const match = row.match(/^"[^"]*","([^"]*)","([^"]*)","([^"]*)"/);
  if (!match) return;
  const [, code, locality] = match;
  if (!verifiedCodes.has(code) || !locality) return;
  (localitiesByCode.get(code) || localitiesByCode.set(code, new Set()).get(code)).add(locality.trim());
});

const result = Object.fromEntries([...localitiesByCode.entries()].map(([code, localities]) => {
  const names = [...localities].sort((a, b) => a.localeCompare(b));
  return [code, names];
}));
await writeFile(new URL("../src/data/eligibleLocalities.json", import.meta.url), `${JSON.stringify(result)}\n`);
console.log(`Generated ${Object.keys(result).length} eligible postcode localities.`);
