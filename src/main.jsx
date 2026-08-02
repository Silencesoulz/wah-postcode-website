import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { activeTable, visaTables } from "./data/visaTables";
import {
  financialLetterPoints,
  healthCheck,
  personalChecklist,
  selfFundedChecklist,
  sponsorChecklist,
} from "./data/visaGuide";
import "./styles.css";

function Badge({ children }) {
  return <span className="badge green">{children}</span>;
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><circle cx="18.5" cy="8.5" r="3" fill="currentColor" /><path d="M5 20.5c3.3-4.5 6.2-4.5 9.2-.8 2.3 2.8 4.7 3 8.8-.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><path d="M5 16.5v4h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
}

function ChecklistCard({ title, items, tone = "green" }) {
  return (
    <article className={`guide-card ${tone}`}>
      <h3>{title}</h3>
      <ul>
        {items.map(([label, description]) => (
          <li key={label}>
            <strong>{label}</strong>
            <span>{description}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function VisaGuide() {
  return (
    <section className="visa-guide">
      <div className="guide-heading">
        <div>
          <p className="eyebrow">WORK & HOLIDAY · SUBCLASS 462</p>
          <h2>Visa application guide</h2>
          <p>
            Prepare your documents before you begin your application. Keep clear
            scans and provide English translations where required.
          </p>
        </div>
        <a
          href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462"
          target="_blank"
          rel="noreferrer"
        >
          Official visa information ↗
        </a>
      </div>
      <div className="guide-alert">
        <strong>Before you submit</strong>
        <span>
          Visa fees, English scores, financial evidence, and health requirements
          can change. Confirm the latest requirements in ImmiAccount and with
          Home Affairs.
        </span>
      </div>
      <div className="guide-grid">
        <ChecklistCard
          title="1. Personal documents"
          items={personalChecklist}
          tone="blue"
        />
        <ChecklistCard
          title="2. If you fund yourself"
          items={selfFundedChecklist}
        />
        <ChecklistCard
          title="3. If someone sponsors you"
          items={sponsorChecklist}
          tone="gold"
        />
      </div>
      <div className="guide-grid guide-bottom">
        <article className="guide-card health">
          <h3>4. Health check</h3>
          <p>{healthCheck.note}</p>
          <h4>Typical Work & Holiday checks shown in your reference</h4>
          <ul className="compact-list">
            {healthCheck.wah.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h4>Reference prices in Thailand</h4>
          <div className="price-list">
            {healthCheck.prices.map(([hospital, price]) => (
              <div key={hospital}>
                <span>{hospital}</span>
                <strong>{price}</strong>
              </div>
            ))}
          </div>
          <small>
            Reference image dated June 2026. Confirm price and available
            examination panel directly with the clinic.
          </small>
        </article>
        <article className="guide-card letter">
          <h3>Financial support letter</h3>
          <p>
            Use a concise English letter to connect your bank balance to a
            clear, supported source of income.
          </p>
          <ol>
            {financialLetterPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </article>
      </div>
    </section>
  );
}

function LocalityExplorer({ postcode }) {
  const [localitiesByPostcode, setLocalitiesByPostcode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const localities = localitiesByPostcode?.[postcode] || [];

  const loadLocalities = async () => {
    if (localitiesByPostcode || loading) return;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.csv",
      );
      if (!response.ok) throw new Error("Could not load locality data");
      const index = {};
      (await response.text())
        .split(/\r?\n/)
        .slice(1)
        .forEach((row) => {
          const columns = row.startsWith('"')
            ? row.slice(1, -1).split('","')
            : row.split(",");
          const [, code, locality, state] = columns;
          if (!code || !locality || !state) return;
          const entry = (index[code] ||= new Set());
          entry.add(`${locality} (${state})`);
        });
      setLocalitiesByPostcode(
        Object.fromEntries(
          Object.entries(index).map(([code, values]) => [
            code,
            [...values].sort(),
          ]),
        ),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="locality-explorer locality-inline">
      <div className="locality-copy">
        <p className="eyebrow">POSTCODE LOCALITIES</p>
        <h2>Localities for {postcode}</h2>
        <p>One postcode can cover multiple suburbs, towns or localities.</p>
      </div>
      {!localitiesByPostcode && (
        <button onClick={loadLocalities} disabled={loading}>
          {loading ? "Loading localities…" : "Show localities"}
        </button>
      )}
      {error && <small>Could not load locality data. Please try again.</small>}
      {localitiesByPostcode && (
        <div className="locality-results">
          {localities.length ? (
            localities.map((locality) => <span key={locality}>{locality}</span>)
          ) : (
            <small>No locality names were found for this postcode.</small>
          )}
        </div>
      )}
    </section>
  );
}

const stateNames = {
  ACT: "Australian Capital Territory",
  NSW: "New South Wales",
  NT: "Northern Territory",
  QLD: "Queensland",
  SA: "South Australia",
  TAS: "Tasmania",
  VIC: "Victoria",
  WA: "Western Australia",
  NI: "Norfolk Island",
};

const postcodeCode = (feature) =>
  String(feature.properties.poa_code_2021).padStart(4, "0");

function featureCentre(feature) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  const visit = (coordinates) => {
    if (typeof coordinates[0] === "number") {
      const [lng, lat] = coordinates;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      return;
    }
    coordinates.forEach(visit);
  };
  visit(feature.geometry.coordinates);
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

function LabelDensity({ boundaries, selectedCode, onChange }) {
  const map = useMap();
  useEffect(() => {
    const updateLabels = () => {
      if (!boundaries || map.getZoom() < 9) return onChange(new Set());
      const zoom = map.getZoom();
      const [cellWidth, cellHeight] = zoom >= 10 ? [76, 38] : [130, 56];
      const occupiedCells = new Set();
      const visibleCodes = new Set();
      const features = [...boundaries.features].sort((a, b) =>
        postcodeCode(a) === selectedCode
          ? -1
          : postcodeCode(b) === selectedCode
            ? 1
            : 0,
      );
      features.forEach((feature) => {
        const code = postcodeCode(feature);
        const point = map.latLngToContainerPoint(featureCentre(feature));
        const size = map.getSize();
        if (
          point.x < -30 ||
          point.y < -20 ||
          point.x > size.x + 30 ||
          point.y > size.y + 20
        )
          return;
        const cell = `${Math.floor(point.x / cellWidth)}:${Math.floor(point.y / cellHeight)}`;
        if (code === selectedCode || !occupiedCells.has(cell)) {
          visibleCodes.add(code);
          occupiedCells.add(cell);
        }
      });
      onChange(visibleCodes);
    };
    updateLabels();
    map.on("moveend zoomend resize", updateLabels);
    return () => map.off("moveend zoomend resize", updateLabels);
  }, [boundaries, map, onChange, selectedCode]);
  return null;
}

function useResponsivePageSize() {
  const getPageSize = () =>
    window.innerWidth <= 850 ? 6 : window.innerHeight >= 1000 ? 12 : 10;
  const [pageSize, setPageSize] = useState(getPageSize);
  useEffect(() => {
    const updatePageSize = () => setPageSize(getPageSize());
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);
  return pageSize;
}

function ZoomWatcher({ onZoom }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  return null;
}

function MapFocus({ boundaries, selectedCode, focusZoom }) {
  const map = useMap();
  useEffect(() => {
    const feature = boundaries?.features.find(
      (item) => postcodeCode(item) === selectedCode,
    );
    if (!feature) return;
    const bounds = L.geoJSON(feature).getBounds();
    map.flyTo(bounds.getCenter(), focusZoom, { animate: true, duration: 0.7 });
  }, [boundaries, focusZoom, map, selectedCode]);
  return null;
}

function AustraliaMap({
  table,
  postcodes,
  selected,
  onSelect,
  onBoundaryCodes,
  focusZoom,
}) {
  const [boundaries, setBoundaries] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [zoom, setZoom] = useState(4);
  const [visibleLabelCodes, setVisibleLabelCodes] = useState(new Set());

  useEffect(() => {
    const controller = new AbortController();
    const chunks = Array.from(
      { length: Math.ceil(postcodes.length / 70) },
      (_, index) => postcodes.slice(index * 70, index * 70 + 70),
    );
    Promise.all(
      chunks.map((chunk) => {
        const codes = chunk.map((item) => `'${item.code}'`).join(",");
        const query = new URLSearchParams({
          where: `POA_CODE_2021 IN (${codes})`,
          outFields: "POA_CODE_2021,POA_NAME_2021",
          returnGeometry: "true",
          outSR: "4326",
          f: "geojson",
        });
        return fetch(
          `https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/MapServer/0/query?${query}`,
          { signal: controller.signal },
        ).then((response) => response.json());
      }),
    )
      .then((results) => {
        const features = results.flatMap((result) => result.features || []);
        onBoundaryCodes(features.map(postcodeCode));
        setBoundaries({ type: "FeatureCollection", features });
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(true);
      });
    return () => controller.abort();
  }, [postcodes, onBoundaryCodes]);

  const selectedCode = selected?.code;
  const showPostcodeLabels = zoom >= 9;
  const updateVisibleLabels = useCallback((nextCodes) => {
    setVisibleLabelCodes((currentCodes) => {
      if (
        currentCodes.size === nextCodes.size &&
        [...currentCodes].every((code) => nextCodes.has(code))
      )
        return currentCodes;
      return nextCodes;
    });
  }, []);
  const labelKey = [...visibleLabelCodes].sort().join(",");
  const style = (feature) => ({
    color: selectedCode
      ? postcodeCode(feature) === selectedCode
        ? "#f2c94c"
        : "#3f8256"
      : "#b7c7bd",
    weight: postcodeCode(feature) === selectedCode ? 2.4 : 1,
    fillColor: postcodeCode(feature) === selectedCode ? "#67a978" : "#7fba8b",
    fillOpacity: selectedCode
      ? postcodeCode(feature) === selectedCode
        ? 0.7
        : 0.34
      : 0,
  });
  const onEachFeature = (feature, layer) => {
    const code = postcodeCode(feature);
    const areaName = feature.properties.poa_name_2021;
    const tooltipName = areaName && areaName !== code ? areaName : "";
    const hasPermanentLabel =
      showPostcodeLabels &&
      (visibleLabelCodes.has(code) || code === selectedCode);
    layer.bindTooltip(
      `<strong>${code}</strong>${hasPermanentLabel || !tooltipName ? "" : `<br/>${tooltipName}`}`,
      {
        sticky: !hasPermanentLabel,
        permanent: hasPermanentLabel,
        direction: "center",
        className: "postcode-map-label",
      },
    );
    layer.on("click", () =>
      onSelect(postcodes.find((item) => item.code === code)),
    );
  };

  return (
    <div className="leaflet-wrap">
      <MapContainer
        center={[-25.1, 133.4]}
        zoom={4}
        minZoom={4}
        maxZoom={10}
        maxBounds={[
          [-44.8, 111.5],
          [-8.2, 155.5],
        ]}
        maxBoundsViscosity={1}
        scrollWheelZoom
        zoomControl={false}
        className="zone-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="topright" />
        <ZoomWatcher onZoom={setZoom} />
        <MapFocus
          boundaries={boundaries}
          selectedCode={selectedCode}
          focusZoom={focusZoom}
        />
        <LabelDensity
          boundaries={boundaries}
          selectedCode={selectedCode}
          onChange={updateVisibleLabels}
        />
        {boundaries && (
          <GeoJSON
            key={`${selectedCode}-${zoom}-${labelKey}`}
            data={boundaries}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      <div className="map-intro">
        <span>TABLE {table.number}</span>
        <strong>{table.label}</strong>
        <small>
          {showPostcodeLabels
            ? "Labels are reduced in dense areas — zoom in for more"
            : "Hover a boundary, or zoom in to show labels"}
        </small>
      </div>
      <div className="map-status">
        {loadError
          ? "Boundary data could not load — use postcode search."
          : boundaries
            ? `${boundaries.features.length} postcode boundaries loaded`
            : "Loading postcode boundaries…"}
      </div>
    </div>
  );
}

function App() {
  const pageSize = useResponsivePageSize();
  const [table, setTable] = useState(activeTable);
  const [postcodes, setPostcodes] = useState(activeTable.postcodes);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loadingTable, setLoadingTable] = useState(false);
  const [eligibilityIndex, setEligibilityIndex] = useState({});
  const [allPostcodes, setAllPostcodes] = useState([]);
  const [jobFilter, setJobFilter] = useState("all");
  const [mapBoundaryCodes, setMapBoundaryCodes] = useState(null);
  const [selectionSource, setSelectionSource] = useState("list");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("map");
  useEffect(() => {
    let active = true;
    Promise.allSettled(
      visaTables.map(async (area) => ({ area, records: await area.load() })),
    ).then((results) => {
      if (!active) return;
      const index = {};
      const combinedPostcodes = {};
      results
        .filter((result) => result.status === "fulfilled")
        .forEach(({ value: { area, records } }) => {
          records.forEach((record) => {
            combinedPostcodes[record.code] ||= record;
            const entry = (index[record.code] ||= {
              jobs: new Set(),
              areas: [],
            });
            area.jobs.forEach((job) => entry.jobs.add(job));
            if (!entry.areas.some((item) => item.id === area.id))
              entry.areas.push(area);
          });
        });
      setEligibilityIndex(
        Object.fromEntries(
          Object.entries(index).map(([code, entry]) => [
            code,
            { ...entry, jobs: [...entry.jobs] },
          ]),
        ),
      );
      setAllPostcodes(
        Object.values(combinedPostcodes).sort((a, b) =>
          a.code.localeCompare(b.code),
        ),
      );
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setQuery("");
    setStateFilter("all");
    setJobFilter("all");
    setPage(1);
    setPostcodes([]);
    setSelected(null);
    setLoadingTable(true);
    table
      .load()
      .then((records) => {
        if (active) setPostcodes(records);
      })
      .catch(() => {
        if (active) setPostcodes([]);
      })
      .finally(() => {
        if (active) setLoadingTable(false);
      });
    return () => {
      active = false;
    };
  }, [table]);
  const jobOptions = useMemo(
    () =>
      [
        ...new Set(
          Object.values(eligibilityIndex).flatMap((item) => item.jobs),
        ),
      ].sort(),
    [eligibilityIndex],
  );
  const jobPostcodes = useMemo(
    () =>
      jobFilter === "all"
        ? postcodes
        : allPostcodes.filter((item) =>
            eligibilityIndex[item.code]?.jobs.includes(jobFilter),
          ),
    [allPostcodes, eligibilityIndex, jobFilter, postcodes],
  );
  const mappablePostcodes = useMemo(
    () =>
      mapBoundaryCodes
        ? jobPostcodes.filter((item) => mapBoundaryCodes.includes(item.code))
        : jobPostcodes,
    [jobPostcodes, mapBoundaryCodes],
  );
  const searchMatches = useMemo(
    () =>
      mappablePostcodes.filter((item) =>
        `${item.code} ${item.town} ${item.state} ${stateNames[item.state] || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [mappablePostcodes, query],
  );
  const availableStates = useMemo(
    () =>
      [...new Set(searchMatches.map((item) => item.state))].sort((a, b) =>
        (stateNames[a] || a).localeCompare(stateNames[b] || b),
      ),
    [searchMatches],
  );
  const matches = useMemo(
    () =>
      stateFilter === "all"
        ? searchMatches
        : searchMatches.filter((item) => item.state === stateFilter),
    [searchMatches, stateFilter],
  );
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleMatches = matches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const groupedMatches = visibleMatches.reduce((groups, item) => {
    (groups[item.state] ??= []).push(item);
    return groups;
  }, {});
  const selectedEligibility = selected
    ? eligibilityIndex[selected.code] || { jobs: table.jobs, areas: [table] }
    : null;
  const selectFirstMatch = (event) => {
    if (event.key === "Enter" && matches[0]) {
      selectPostcode(matches[0], "list");
      setPage(1);
    }
  };
  const changeQuery = (value) => {
    setQuery(value);
    setStateFilter("all");
    setPage(1);
  };
  const changeTable = (item) => {
    setJobFilter("all");
    setPage(1);
    setTable(item);
  };
  const selectPostcode = (item, source) => {
    setSelectionSource(source);
    setSelected(item);
    window.setTimeout(() => {
      const target = document.querySelector(".workspace");
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };
  const navigateTo = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeStateFilter = (value) => {
    setStateFilter(value);
    setPage(1);
  };
  const changeJobFilter = (value) => {
    setJobFilter(value);
    setStateFilter("all");
    setPage(1);
  };
  const mapPostcodes = jobFilter === "all" ? postcodes : jobPostcodes;
  useEffect(() => {
    setMapBoundaryCodes(null);
  }, [mapPostcodes]);
  useEffect(() => {
    if (
      mapBoundaryCodes &&
      selected &&
      !mapBoundaryCodes.includes(selected.code)
    )
      setSelected(mappablePostcodes[0] || null);
  }, [mapBoundaryCodes, mappablePostcodes, selected]);

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span>Work &amp; Holiday Guide</span>
        </div>
        <nav
          className={mobileMenuOpen ? "open" : ""}
          onClick={() => setMobileMenuOpen(false)}
        >
          <a
            className={activeView === "map" ? "active" : ""}
            onClick={() => navigateTo("map")}
          >
            Postcode map
          </a>
          <a
            className={activeView === "guide" ? "active" : ""}
            onClick={() => navigateTo("guide")}
          >
            Visa guide
          </a>
          <a className="disabled" aria-disabled="true">Find jobs</a>
        </nav>
        <button
          className="mobile-menu-btn"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">WORK & HOLIDAY · SUBCLASS 462</p>
          <h1>
            Make your Australian year
            <br />
            <em>count.</em>
          </h1>
          <p className="hero-copy">
            Check eligible postcodes and specified work for your second or third
            Work and Holiday visa.
          </p>
        </div>
        <div className="hero-note">
          <span className="note-icon">✦</span>
          <div>
            <strong>Work smart, stay longer</strong>
            <p>
              Specified work must be paid and completed in an eligible area.
            </p>
          </div>
        </div>
      </section>
      {activeView === "map" ? (
        <section className="workspace">
          <aside className="sidebar">
            <div className="side-head">
              <div>
                <p className="eyebrow">POSTCODE EXPLORER</p>
                <h2>Where can I work?</h2>
              </div>
              <span className="count">
                {loadingTable ? "Loading…" : `${matches.length} areas`}
              </span>
            </div>
            <div className="search">
              <span>⌕</span>
              <input
                value={query}
                disabled={loadingTable}
                onKeyDown={selectFirstMatch}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="Search town or postcode"
              />
            </div>
            <div className="filters zone-tabs">
              {visaTables.map((item) => (
                <button
                  key={item.id}
                  className={table.id === item.id ? "selected" : ""}
                  onClick={() => changeTable(item)}
                  title={`Table ${item.number}: ${item.label}`}
                >
                  {item.shortLabel}
                </button>
              ))}
            </div>
            <label className="state-filter">
              <span>WORK TYPE</span>
              <select
                value={jobFilter}
                onChange={(event) => changeJobFilter(event.target.value)}
              >
                <option value="all">All work types</option>
                {jobOptions.map((job) => (
                  <option value={job} key={job}>
                    {job}
                  </option>
                ))}
              </select>
            </label>
            <label className="state-filter">
              <span>STATE / TERRITORY</span>
              <select
                value={stateFilter}
                onChange={(event) => changeStateFilter(event.target.value)}
                disabled={loadingTable}
              >
                <option value="all">All states & territories</option>
                {availableStates.map((state) => (
                  <option value={state} key={state}>
                    {stateNames[state] || state} ({state})
                  </option>
                ))}
              </select>
            </label>
            <div className="postcode-list">
              {Object.entries(groupedMatches).map(([state, items]) => (
                <section className="state-group" key={state}>
                  <h3>
                    {stateNames[state] || state}
                    <small>{state}</small>
                  </h3>
                  {items.map((item) => (
                    <button
                      className={`postcode-row ${selected?.code === item.code ? "current" : ""}`}
                      key={item.code}
                      onClick={() => selectPostcode(item, "list")}
                    >
                      <span className="postcode-number">{item.code}</span>
                      <span className="postcode-place">{item.town}</span>
                      <span className="row-arrow">→</span>
                    </button>
                  ))}
                </section>
              ))}
              {loadingTable && (
                <p className="empty">Loading Table {table.number} postcodes…</p>
              )}
              {!loadingTable && !matches.length && (
                <p className="empty">
                  No matching postcodes for this work type.
                </p>
              )}
            </div>
            {!loadingTable && matches.length > 0 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                <span>
                  Page {currentPage} / {pageCount}
                </span>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                >
                  →
                </button>
              </div>
            )}
            <p className="side-foot">
              {matches.length
                ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, matches.length)} of ${matches.length} areas in this category.`
                : "Choose a category or search for a postcode."}
            </p>
          </aside>
          <div className="main-panel">
            <div className="panel-title">
              <div>
                <p className="eyebrow">
                  INTERACTIVE MAP · TABLE {table.number}
                </p>
                <h2>
                  {jobFilter === "all"
                    ? table.label
                    : `${jobFilter} across eligible areas`}
                </h2>
              </div>
            </div>
            {postcodes.length > 0 && (
              <AustraliaMap
                key={`${table.id}-${jobFilter}`}
                table={table}
                postcodes={mapPostcodes}
                selected={selected}
                onSelect={(item) => selectPostcode(item, "map")}
                onBoundaryCodes={setMapBoundaryCodes}
                focusZoom={selectionSource === "map" ? 7 : 9}
              />
            )}{" "}
            {selected && (
              <div className="detail-card">
                <div className="detail-top">
                  <div>
                    <p className="eyebrow">SELECTED POSTCODE</p>
                    <div className="selected-place">
                      <h2>{selected.code}</h2>
                      <span>
                        {selected.town},{" "}
                        {stateNames[selected.state] || selected.state}
                      </span>
                    </div>
                  </div>
                  <Badge>Eligible work area</Badge>
                </div>
                <div className="eligibility-grid">
                  <div>
                    <p className="label">Can count toward</p>
                    <div className="visa-pills">
                      <span>2nd visa</span>
                      <span>3rd visa</span>
                    </div>
                  </div>
                  <div>
                    <p className="label">Eligible designated areas</p>
                    <div className="area-tags">
                      {selectedEligibility.areas.map((area) => (
                        <span
                          key={area.id}
                          style={{ background: area.color, color: area.accent }}
                        >
                          {area.shortLabel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="label">Specified work categories</p>
                    <div className="job-tags">
                      {selectedEligibility.jobs.map((job) => (
                        <span key={job}>{job}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <LocalityExplorer postcode={selected.code} />
                <div className="detail-foot">
                  <span>
                    ⓘ Work categories are combined when this postcode appears in
                    more than one declared area.
                  </span>
                  <a
                    href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/specified-462-work"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read official requirements ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <VisaGuide />
      )}
      <footer>
        <span>
          Work &amp; Holiday Guide / an easier way to plan your regional year
        </span>
        <span>
          Data guide updated 05 APR 2025 · Always verify before you start
        </span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
