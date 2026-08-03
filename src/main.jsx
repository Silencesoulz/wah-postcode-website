import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { activeTable, visaTables } from "./data/visaTables";
import {
  financialLetterPoints,
  healthCheck,
  personalChecklist,
  selfFundedChecklist,
  sponsorChecklist,
} from "./data/visaGuide";
import "./styles.css";

const AustraliaMap = React.lazy(() => import("./AustraliaMap"));

function Badge({ children }) {
  return <span className="badge green">{children}</span>;
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><circle cx="18.5" cy="8.5" r="3" fill="currentColor" /><path d="M5 20.5c3.3-4.5 6.2-4.5 9.2-.8 2.3 2.8 4.7 3 8.8-.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><path d="M5 16.5v4h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
}

function GuideIcon({ name }) {
  const paths = {
    passport: <><rect x="5" y="3.5" width="14" height="17" rx="2" /><circle cx="12" cy="10" r="2.2" /><path d="M8.5 16c1.9-2 5.1-2 7 0" /></>,
    wallet: <><path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9.5A1.5 1.5 0 0 1 18.5 20H5.5A1.5 1.5 0 0 1 4 18.5z" /><path d="M4 8V6.5A1.5 1.5 0 0 1 5.5 5H17" /><path d="M15 13h5" /><circle cx="15" cy="13" r=".6" fill="currentColor" /></>,
    family: <><circle cx="9" cy="8" r="2.3" /><circle cx="16.5" cy="9.5" r="1.8" /><path d="M4.8 18c.4-3 2-4.6 4.2-4.6s3.9 1.6 4.3 4.6" /><path d="M13.3 17.5c.4-2.2 1.6-3.5 3.3-3.5 1.5 0 2.7 1.1 3.1 3.2" /></>,
    health: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>,
    letter: <><rect x="4" y="6" width="16" height="12" rx="1.5" /><path d="m5 7 7 5 7-5" /></>,
  };
  return <span className="guide-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg></span>;
}

function GuideCardTitle({ icon, children }) {
  return <div className="guide-card-title"><GuideIcon name={icon} /><h3>{children}</h3></div>;
}

function ChecklistCard({ title, items, tone = "green", icon }) {
  return (
    <article className={`guide-card ${tone}`}>
      <GuideCardTitle icon={icon}>{title}</GuideCardTitle>
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
          icon="passport"
        />
        <ChecklistCard
          title="2. If you fund yourself"
          items={selfFundedChecklist}
          icon="wallet"
        />
        <ChecklistCard
          title="3. If someone sponsors you"
          items={sponsorChecklist}
          tone="gold"
          icon="family"
        />
      </div>
      <div className="guide-grid guide-bottom">
        <article className="guide-card health">
          <GuideCardTitle icon="health">4. Health check</GuideCardTitle>
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
          <GuideCardTitle icon="letter">Financial support letter</GuideCardTitle>
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
  const getPageSize = () => (window.innerWidth <= 700 ? 3 : 5);
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

function LegacyAustraliaMap({
  table,
  postcodes,
  selected,
  onSelect,
  onBoundaryData,
  focusZoom,
}) {
  const [boundaries, setBoundaries] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [zoom, setZoom] = useState(4);
  const [visibleLabelCodes, setVisibleLabelCodes] = useState(new Set());
  const geometryGeneralisation =
    postcodes.length > 1200 ? "0.002" : postcodes.length > 600 ? "0.001" : null;

  useEffect(() => {
    const controller = new AbortController();
    // POST avoids URL-length limits, so each request can safely include many
    // more postcodes than a GET query. This keeps large tables lightweight.
    const chunkSize = 350;
    const chunks = Array.from(
      { length: Math.ceil(postcodes.length / chunkSize) },
      (_, index) =>
        postcodes.slice(index * chunkSize, index * chunkSize + chunkSize),
    );
    setBoundaries(null);
    setLoadError(false);
    setLoadingProgress({ loaded: 0, total: chunks.length });

    const fetchChunk = async (chunk) => {
      const codes = chunk.map((item) => `'${item.code}'`).join(",");
      const query = new URLSearchParams({
        where: `POA_CODE_2021 IN (${codes})`,
        outFields: "POA_CODE_2021,POA_NAME_2021",
        returnGeometry: "true",
        outSR: "4326",
        f: "geojson",
      });
      if (geometryGeneralisation)
        query.set("maxAllowableOffset", geometryGeneralisation);
      const response = await fetch(
        "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/MapServer/0/query",
        { method: "POST", body: query, signal: controller.signal },
      );
      if (!response.ok) throw new Error(`Boundary request failed: ${response.status}`);
      return response.json();
    };

    const loadBoundaries = async () => {
      const results = [];
      const concurrentRequests = 4;

      try {
        for (let start = 0; start < chunks.length; start += concurrentRequests) {
          const batch = chunks.slice(start, start + concurrentRequests);
          const settled = await Promise.allSettled(batch.map(fetchChunk));
          if (controller.signal.aborted) return;

          settled.forEach((result) => {
            if (result.status === "fulfilled") results.push(result.value);
          });
          const loadedFeatures = results.flatMap((result) => result.features || []);
          if (loadedFeatures.length) {
            onBoundaryData(loadedFeatures);
            setBoundaries({ type: "FeatureCollection", features: loadedFeatures });
          }
          setLoadingProgress({
            loaded: Math.min(start + batch.length, chunks.length),
            total: chunks.length,
          });
        }

        if (!results.some((result) => result.features?.length))
          throw new Error("No postcode boundaries returned");
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(true);
      }
    };

    loadBoundaries();
    return () => controller.abort();
  }, [geometryGeneralisation, onBoundaryData, postcodes]);

  const selectedCode = selected?.code;
  const showPostcodeLabels = zoom >= 9;
  const isDenseMap = (boundaries?.features.length || 0) > 600;
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
        zoom={4.5}
        zoomSnap={0.5}
        minZoom={4}
        maxZoom={10}
        maxBounds={[
          [-44.8, 111.5],
          [-8.2, 155.5],
        ]}
        maxBoundsViscosity={1}
        scrollWheelZoom
        preferCanvas
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
        {!isDenseMap && (
          <LabelDensity
            boundaries={boundaries}
            selectedCode={selectedCode}
            onChange={updateVisibleLabels}
          />
        )}
        {boundaries && (
          <GeoJSON
            key={
              isDenseMap
                ? "dense-postcode-boundaries"
                : `${selectedCode}-${zoom}-${labelKey}`
            }
            data={boundaries}
            style={style}
            smoothFactor={isDenseMap ? 2.5 : 1}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      <div className="map-intro">
        <span>TABLE {table.number}</span>
        <strong>{table.label}</strong>
        <small>
          {isDenseMap
            ? "Choose a state or postcode to inspect a busy area"
            : showPostcodeLabels
            ? "Labels are reduced in dense areas — zoom in for more"
            : "Hover a boundary, or zoom in to show labels"}
        </small>
      </div>
      <div className="map-status">
        {loadError
          ? "Boundary data could not load — use postcode search."
          : boundaries
            ? `${boundaries.features.length} postcode boundaries loaded`
            : `Loading postcode boundaries… ${loadingProgress.loaded}/${loadingProgress.total}`}
      </div>
    </div>
  );
}

function DeferredAustraliaMap(props) {
  const mapRootRef = useRef(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  useEffect(() => {
    if (props.selected) setShouldLoadMap(true);
  }, [props.selected]);

  return (
    <div ref={mapRootRef}>
      {shouldLoadMap ? (
        <React.Suspense
          fallback={
            <div className="leaflet-wrap map-deferred-placeholder">
              <div className="map-intro"><span>TABLE {props.table.number}</span><strong>{props.table.label}</strong><small>Preparing interactive map…</small></div>
            </div>
          }
        >
          <AustraliaMap {...props} />
        </React.Suspense>
      ) : (
        <div className="leaflet-wrap map-deferred-placeholder">
          <div className="map-intro"><span>TABLE {props.table.number}</span><strong>{props.table.label}</strong><small>Load the interactive map only when you need it.</small></div>
          <button className="map-load-button" type="button" onClick={() => setShouldLoadMap(true)}>Load interactive map</button>
        </div>
      )}
    </div>
  );
}

const PLANNER_STORAGE_KEY = "wah-88-day-planner";
const EVIDENCE_ITEMS = [
  ["contract", "Contract / offer"],
  ["payslip", "Payslip"],
  ["bankTransfer", "Bank transfer"],
  ["timesheet", "Timesheet / roster"],
  ["taxRecord", "Tax record"],
];

const emptyPlannerDraft = () => ({
  mode: "planned",
  postcode: "",
  workType: "",
  startDate: "",
  endDate: "",
  employerName: "",
  employerAbn: "",
  workplace: "",
  supervisor: "",
  actualDays: "",
  rosterNote: "",
  evidence: {},
});

function inclusiveDays(startDate, endDate) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

function AnimatedNumber({ value, celebrate }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const from = previousValue.current;
    previousValue.current = value;
    if (from === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return undefined;
    }
    const startedAt = performance.now();
    const duration = 520;
    let frameId;
    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(from + (value - from) * eased));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <strong className={celebrate ? "planner-number-celebrate" : ""}>{displayValue}</strong>;
}

function playPlannerChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const now = context.currentTime;
  [660, 880].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.12;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.065, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.44);
  });
  window.setTimeout(() => context.close(), 700);
}

function Planner({ allPostcodes, eligibilityIndex, jobOptions, postcodePlace }) {
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState(emptyPlannerDraft);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [celebrateTotal, setCelebrateTotal] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [showPlannedTimeline, setShowPlannedTimeline] = useState(false);
  const [showRecords, setShowRecords] = useState(false);

  useEffect(() => {
    try {
      const savedEntries = window.localStorage.getItem(PLANNER_STORAGE_KEY);
      if (savedEntries) setEntries(JSON.parse(savedEntries));
    } catch {
      // The planner remains usable if private browsing blocks storage.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // A storage failure should not prevent planning work entries.
    }
  }, [entries, ready]);

  const actualEligibleDays = entries
    .filter((entry) => entry.eligible && entry.mode === "actual")
    .reduce((total, entry) => total + entry.days, 0);
  const plannedEligibleDays = entries
    .filter((entry) => entry.eligible)
    .reduce((total, entry) => total + entry.days, 0);
  const progress = Math.min((actualEligibleDays / 88) * 100, 100);
  const remainingDays = Math.max(88 - actualEligibleDays, 0);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormError("");
  };

  const saveEntry = (event) => {
    event.preventDefault();
    const postcode = draft.postcode.trim().padStart(4, "0");
    if (!/^\d{4}$/.test(postcode) || !draft.workType || !draft.startDate || !draft.endDate) {
      setFormError("Add a postcode, work type and start/end dates.");
      return;
    }
    const days = inclusiveDays(draft.startDate, draft.endDate);
    if (days < 1 || Number.isNaN(days)) {
      setFormError("The end date needs to be on or after the start date.");
      return;
    }
    const actualDays = Number(draft.actualDays);
    if (
      draft.mode === "actual" &&
      (!Number.isInteger(actualDays) || actualDays < 1 || actualDays > days)
    ) {
      setFormError("Add the number of days worked within this date range.");
      return;
    }
    const postcodeRecord = allPostcodes.find((item) => item.code === postcode);
    const eligibility = eligibilityIndex[postcode];
    const eligible = Boolean(eligibility?.jobs.includes(draft.workType));
    const entry = {
      ...draft,
      id: editingId || `${Date.now()}-${postcode}`,
      postcode,
      location: postcodeRecord ? postcodePlace(postcodeRecord) : "",
      workType: draft.workType,
      startDate: draft.startDate,
      endDate: draft.endDate,
      calendarDays: days,
      days: draft.mode === "actual" ? actualDays : days,
      eligible,
    };
    setEntries((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? entry : item))
        : [...current, entry],
    );
    if (!editingId && entry.mode === "actual" && entry.eligible) {
      setCelebrateTotal(true);
      playPlannerChime();
      window.setTimeout(() => setCelebrateTotal(false), 750);
    }
    if (!editingId) {
      setShowRecords(true);
      window.setTimeout(() => {
        document.querySelector(entry.mode === "actual" ? ".planner-summary" : ".planner-entries")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    }
    setDraft(emptyPlannerDraft());
    setEditingId(null);
  };

  const editEntry = (entry) => {
    setDraft({ ...emptyPlannerDraft(), ...entry, evidence: entry.evidence || {} });
    setEditingId(entry.id);
    setFormError("");
    window.setTimeout(() => document.querySelector(".planner-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const removeEntry = (entry) => {
    if (!window.confirm(`Delete the ${entry.postcode} work record? This cannot be undone.`)) return;
    setEntries((current) => current.filter((item) => item.id !== entry.id));
  };

  const evidenceCount = (entry) =>
    EVIDENCE_ITEMS.filter(([key]) => entry.evidence?.[key]).length;
  const timelineEntries = useMemo(
    () => [...entries].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || ""))),
    [entries],
  );
  const ganttRange = useMemo(() => {
    const datedEntries = timelineEntries.filter((entry) => entry.startDate && entry.endDate);
    if (!datedEntries.length) return null;
    const timestamps = datedEntries.flatMap((entry) => [
      Date.parse(`${entry.startDate}T00:00:00Z`),
      Date.parse(`${entry.endDate}T00:00:00Z`),
    ]).filter(Number.isFinite);
    const start = Math.min(...timestamps);
    const end = Math.max(...timestamps);
    const totalDays = Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
    return {
      start,
      end,
      totalDays,
      startLabel: new Date(start).toISOString().slice(0, 10),
      midLabel: new Date(start + ((end - start) / 2)).toISOString().slice(0, 10),
      endLabel: new Date(end).toISOString().slice(0, 10),
    };
  }, [timelineEntries]);

  const downloadFile = (filename, contents, type) => {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = entries.map((entry) => [
      entry.mode || "planned", entry.postcode, entry.location, entry.workType,
      entry.startDate, entry.endDate, entry.days, entry.eligible ? "Eligible match" : "Needs review",
      entry.employerName, entry.employerAbn, entry.workplace, entry.supervisor,
      entry.rosterNote, EVIDENCE_ITEMS.filter(([key]) => entry.evidence?.[key]).map(([, label]) => label).join("; "),
    ].map(quote).join(","));
    downloadFile(
      "wah-88-day-work-records.csv",
      ["Mode,Postcode,Area,Work type,Start date,End date,Days,Check,Employer,ABN,Workplace,Supervisor,Roster note,Evidence", ...rows].join("\n"),
      "text/csv;charset=utf-8",
    );
    setBackupMessage("CSV downloaded.");
  };

  return (
    <section className="planner">
      <div className="planner-heading">
        <div>
          <p className="eyebrow">WORK & HOLIDAY · SUBCLASS 462</p>
          <h2>88-day planner</h2>
          <p>Plan specified work, check each postcode and keep an estimate of your eligible days.</p>
        </div>
        <div className="planner-actions">
          <button type="button" onClick={exportCsv} disabled={!entries.length}>Export CSV</button>
          <span className="planner-draft">Draft planner</span>
        </div>
      </div>
      {backupMessage && <p className="planner-backup-message">{backupMessage}</p>}
      <div className="planner-alert">
        <strong>Planning estimate only</strong>
        <span>Home Affairs uses specified-work rules and calendar-month requirements. Confirm your evidence and eligibility before applying.</span>
      </div>
      <div className="planner-grid">
        <form className="planner-form" onSubmit={saveEntry}>
          <div className="planner-card-head">
            <GuideIcon name="letter" />
            <div><h3>{editingId ? "Edit work record" : "Add work record"}</h3><p>Each entry is saved only in this browser.</p></div>
          </div>
          <div className="planner-mode" aria-label="Record type">
            <button type="button" className={draft.mode === "planned" ? "selected" : ""} onClick={() => updateDraft("mode", "planned")}>Planned</button>
            <button type="button" className={draft.mode === "actual" ? "selected" : ""} onClick={() => updateDraft("mode", "actual")}>Actual work</button>
          </div>
          <label>
            <span>POSTCODE</span>
            <input
              inputMode="numeric"
              maxLength="4"
              value={draft.postcode}
              onChange={(event) => updateDraft("postcode", event.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 0800"
            />
          </label>
          <label>
            <span>WORK TYPE</span>
            <select className={draft.workType ? "" : "is-placeholder"} value={draft.workType} onChange={(event) => updateDraft("workType", event.target.value)}>
              <option value="">Choose a work type</option>
              {jobOptions.map((job) => <option key={job} value={job}>{job}</option>)}
            </select>
          </label>
          <div className="planner-date-row">
            <label><span>START DATE</span><input className={draft.startDate ? "" : "is-placeholder"} type="date" value={draft.startDate} onChange={(event) => updateDraft("startDate", event.target.value)} /></label>
            <label><span>END DATE</span><input className={draft.endDate ? "" : "is-placeholder"} type="date" value={draft.endDate} onChange={(event) => updateDraft("endDate", event.target.value)} /></label>
          </div>
          {draft.mode === "actual" && (
            <div className="planner-actual-work">
              <label><span>ACTUAL DAYS WORKED</span><input inputMode="numeric" type="number" min="1" value={draft.actualDays} onChange={(event) => updateDraft("actualDays", event.target.value)} placeholder="e.g. 10" /></label>
              <label><span>ROSTER / TIMESHEET NOTE</span><textarea value={draft.rosterNote} onChange={(event) => updateDraft("rosterNote", event.target.value)} placeholder="e.g. Mon–Fri, 8 hours per day" /></label>
            </div>
          )}
          <details className="planner-details">
            <summary>Employer details <span>optional</span></summary>
            <div className="planner-detail-grid">
              <label><span>EMPLOYER / BUSINESS</span><input value={draft.employerName} onChange={(event) => updateDraft("employerName", event.target.value)} placeholder="Business name" /></label>
              <label><span>ABN</span><input inputMode="numeric" value={draft.employerAbn} onChange={(event) => updateDraft("employerAbn", event.target.value)} placeholder="Australian Business Number" /></label>
              <label><span>WORKPLACE</span><input value={draft.workplace} onChange={(event) => updateDraft("workplace", event.target.value)} placeholder="Town or worksite" /></label>
              <label><span>SUPERVISOR CONTACT</span><input value={draft.supervisor} onChange={(event) => updateDraft("supervisor", event.target.value)} placeholder="Name, phone or email" /></label>
            </div>
          </details>
          <fieldset className="evidence-list">
            <legend>Evidence checklist <span>optional</span></legend>
            <div>
              {EVIDENCE_ITEMS.map(([key, label]) => (
                <label key={key}>
                  <input type="checkbox" checked={Boolean(draft.evidence[key])} onChange={(event) => updateDraft("evidence", { ...draft.evidence, [key]: event.target.checked })} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {formError && <p className="planner-error">{formError}</p>}
          <div className="planner-submit-row">
            {editingId && <button type="button" className="planner-cancel" onClick={() => { setDraft(emptyPlannerDraft()); setEditingId(null); }}>Cancel</button>}
            <button type="submit" disabled={!jobOptions.length}>{editingId ? "Save changes" : "Add record"}</button>
          </div>
        </form>
        <aside className="planner-summary">
          <p className="eyebrow">ACTUAL ELIGIBLE DAYS</p>
          <div className="planner-total"><AnimatedNumber value={actualEligibleDays} celebrate={celebrateTotal} /><span>/ 88 days</span></div>
          <div className="planner-progress" aria-label={`${actualEligibleDays} of 88 actual days recorded`}><span style={{ width: `${progress}%` }} /></div>
          <p>{remainingDays ? `${remainingDays} more actual days to reach 88.` : "88-day planning target reached."}</p>
          <div className="planner-projection"><span>Projected eligible days</span><strong>{plannedEligibleDays}</strong></div>
          <small>Only postcode and work-type matches are included. Keep evidence for every actual record.</small>
        </aside>
      </div>
      <div className="planner-records-flow">
      <section className="planner-entries">
        <div className="planner-list-head records-head"><div><h3>Your work records</h3><span>{entries.length} entries</span></div><button type="button" aria-expanded={showRecords} onClick={() => setShowRecords((current) => !current)}>{showRecords ? "Collapse" : "Show records"}</button></div>
        {showRecords && entries.length > 0 && (
          <div className="planner-table-head" aria-hidden="true">
            <span>POSTCODE / AREA</span>
            <span>WORK TYPE</span>
            <span>PERIOD</span>
            <span>CHECK</span>
            <span>DAYS</span>
            <span />
          </div>
        )}
        {showRecords && entries.length ? (
          <div className="planner-entry-list">
            {entries.map((entry) => (
              <article className="planner-entry" key={entry.id}>
                <div className="planner-entry-grid">
                  <div className="entry-location"><strong>{entry.postcode}</strong><span>{entry.location || "Eligible postcode"}</span></div>
                  <p className="entry-work">{entry.workType}</p>
                  <p className="entry-period">{entry.startDate} → {entry.endDate}</p>
                  <div className="entry-checks"><span className={entry.eligible ? "entry-status eligible" : "entry-status review"}>{entry.eligible ? "Eligible match" : "Needs review"}</span><span className={`record-mode ${entry.mode || "planned"}`}>{entry.mode === "actual" ? "Actual" : "Planned"}</span></div>
                  <div className="entry-days"><strong>{entry.days}</strong><span>days</span></div>
                  <div className="entry-actions"><button type="button" onClick={() => editEntry(entry)}>Edit</button><button type="button" aria-label={`Remove ${entry.postcode} entry`} onClick={() => removeEntry(entry)}>×</button></div>
                </div>
                <details className="entry-details">
                  <summary>Employer &amp; evidence <span>{evidenceCount(entry)} / {EVIDENCE_ITEMS.length} checked</span></summary>
                  <div><p><strong>Employer</strong>{entry.employerName || "Not added"}</p><p><strong>ABN</strong>{entry.employerAbn || "Not added"}</p><p><strong>Workplace</strong>{entry.workplace || "Not added"}</p><p><strong>Supervisor</strong>{entry.supervisor || "Not added"}</p>{entry.mode === "actual" && <p><strong>Roster note</strong>{entry.rosterNote || "Not added"}</p>}</div>
                  <ul>{EVIDENCE_ITEMS.map(([key, label]) => <li className={entry.evidence?.[key] ? "done" : ""} key={key}>{entry.evidence?.[key] ? "✓" : "○"} {label}</li>)}</ul>
                </details>
              </article>
            ))}
          </div>
        ) : showRecords ? <p className="planner-empty">Add your first work record above. Your entries stay on this device.</p> : <p className="planner-collapsed-note">Records are collapsed to keep your planner focused.</p>}
      </section>
      <section className="planner-timeline">
        <div className="planner-list-head timeline-head"><h3>Work timeline</h3><div><button type="button" className={showPlannedTimeline ? "selected" : ""} onClick={() => setShowPlannedTimeline((current) => !current)}>Show planned work</button></div></div>
        {ganttRange ? (
          <>
          <p className="gantt-mobile-hint">Swipe sideways to view the full timeline.</p>
          <div className="gantt-scroll" aria-label="Work timeline, scroll horizontally on mobile">
            <div className="gantt-chart">
              <div className="gantt-axis"><span>RECORD</span><div><span>{ganttRange.startLabel}</span><span>{ganttRange.midLabel}</span><span>{ganttRange.endLabel}</span></div></div>
              {(showPlannedTimeline ? ["actual", "planned"] : ["actual"]).map((mode) => {
                const groupEntries = timelineEntries.filter(
                  (entry) =>
                    (entry.mode || "planned") === mode && entry.startDate && entry.endDate,
                );
                return (
                  <section className={`gantt-group ${mode}`} key={mode}>
                    <h4>{mode === "actual" ? "ACTUAL WORK DAYS" : "PLANNED WORK DAYS"}<span>{groupEntries.length} records</span></h4>
                    {groupEntries.length ? groupEntries.map((entry) => {
                      const entryStart = Date.parse(`${entry.startDate}T00:00:00Z`);
                      const calendarDays = entry.calendarDays || inclusiveDays(entry.startDate, entry.endDate);
                      const left = ((entryStart - ganttRange.start) / 86_400_000 / ganttRange.totalDays) * 100;
                      const width = Math.max((calendarDays / ganttRange.totalDays) * 100, 2.8);
                      return (
                        <div className="gantt-row" key={entry.id}>
                          <div><strong>{entry.postcode}</strong><span>{entry.workType}</span></div>
                          <div className="gantt-track">
                            <button type="button" className="gantt-bar" style={{ left: `${left}%`, width: `${width}%` }} onClick={() => editEntry(entry)} title={`Edit ${entry.postcode}: ${entry.startDate} to ${entry.endDate}`}>
                              <span>{entry.days}d</span>
                            </button>
                          </div>
                          <button className="gantt-delete" type="button" aria-label={`Remove ${entry.postcode} entry`} onClick={() => removeEntry(entry)}>×</button>
                        </div>
                      );
                    }) : <p className="gantt-empty">No {mode} records yet.</p>}
                  </section>
                );
              })}
            </div>
          </div>
          </>
        ) : <p className="planner-empty">Your planned and actual work periods will appear here.</p>}
      </section>
      </div>
    </section>
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
  const [directoryCodes, setDirectoryCodes] = useState(null);
  const [searchDirectoryCodes, setSearchDirectoryCodes] = useState(null);
  const [localityLookup, setLocalityLookup] = useState(null);
  const [mapAreaNames, setMapAreaNames] = useState({});
  const [selectionSource, setSelectionSource] = useState("list");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("map");
  const pendingSelectionRef = useRef(null);
  useEffect(() => {
    let active = true;
    import("./data/eligibleLocalities.json")
      .then((module) => {
        if (active) setLocalityLookup(module.default);
      })
      .catch(() => {
        if (active) setLocalityLookup({});
      });
    return () => {
      active = false;
    };
  }, []);
  const handleBoundaryData = useCallback((features) => {
    setMapBoundaryCodes(features.map(postcodeCode));
    const namesByCode = {};
    features.forEach((feature) => {
      const code = postcodeCode(feature);
      const name = feature.properties?.poa_name_2021?.trim();
      if (!name || name === code) return;
      (namesByCode[code] ||= new Set()).add(name);
    });
    setMapAreaNames((currentNames) => {
      const nextNames = { ...currentNames };
      Object.entries(namesByCode).forEach(([code, names]) => {
        nextNames[code] = names.size === 1 ? [...names][0] : "Multiple suburbs";
      });
      return nextNames;
    });
  }, []);
  useEffect(() => {
    let active = true;
    const loadEligibilityIndex = () => {
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
              const entry = (index[record.code] ||= { jobs: new Set(), areas: [] });
              area.jobs.forEach((job) => entry.jobs.add(job));
              if (!entry.areas.some((item) => item.id === area.id)) entry.areas.push(area);
            });
          });
        setEligibilityIndex(
          Object.fromEntries(
            Object.entries(index).map(([code, entry]) => [code, { ...entry, jobs: [...entry.jobs] }]),
          ),
        );
        setAllPostcodes(Object.values(combinedPostcodes).sort((a, b) => a.code.localeCompare(b.code)));
      });
    };
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(loadEligibilityIndex, { timeout: 1500 })
      : window.setTimeout(loadEligibilityIndex, 150);
    return () => {
      active = false;
      if (window.cancelIdleCallback && window.requestIdleCallback)
        window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);
  useEffect(() => {
    let active = true;
    const preserveSearch = pendingSelectionRef.current?.tableId === table.id;
    if (!preserveSearch) {
      setQuery("");
      setStateFilter("all");
      setJobFilter("all");
    }
    setPage(1);
    setPostcodes([]);
    setSelected(null);
    setLoadingTable(true);
    table
      .load()
      .then((records) => {
        if (!active) return;
        setPostcodes(records);
        const pendingSelection = pendingSelectionRef.current;
        if (pendingSelection?.tableId !== table.id) return;
        pendingSelectionRef.current = null;
        setSelectionSource(pendingSelection.source);
        setSelected(
          records.find((item) => item.code === pendingSelection.item.code) || pendingSelection.item,
        );
        window.setTimeout(() => {
          const isMobile = window.matchMedia("(max-width: 700px)").matches;
          (isMobile ? document.querySelector(".main-panel") : document.querySelector(".workspace"))?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 0);
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
  const postcodePlace = useCallback(
    (item) => localityLookup?.[item.code]?.label || mapAreaNames[item.code] || item.town,
    [localityLookup, mapAreaNames],
  );
  const mappablePostcodes = useMemo(
    () =>
      localityLookup
        ? jobPostcodes.filter((item) => localityLookup[item.code])
        : [],
    [jobPostcodes, localityLookup],
  );
  const boundariesLoading = postcodes.length > 0 && localityLookup === null;
  const globalSearchCandidates = useMemo(
    () => {
      if (!query.trim()) return [];
      if (!localityLookup) return [];
      const pool = (jobFilter === "all"
        ? allPostcodes
        : allPostcodes.filter((item) => eligibilityIndex[item.code]?.jobs.includes(jobFilter)))
        .filter((item) => localityLookup[item.code]);
      return pool.filter((item) =>
        `${item.code} ${postcodePlace(item)} ${localityLookup[item.code]?.search || ""} ${item.state} ${stateNames[item.state] || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      );
    },
    [allPostcodes, eligibilityIndex, jobFilter, localityLookup, postcodePlace, query],
  );
  useEffect(() => {
    const controller = new AbortController();
    const queryValue = query.trim();
    if (!localityLookup) {
      setSearchDirectoryCodes(null);
      return () => controller.abort();
    }
    if (!queryValue) {
      setSearchDirectoryCodes(null);
      return () => controller.abort();
    }
    if (!globalSearchCandidates.length) {
      setSearchDirectoryCodes([]);
      return () => controller.abort();
    }
    setSearchDirectoryCodes(globalSearchCandidates.map((item) => item.code));
    return () => controller.abort();
    setSearchDirectoryCodes(null);
    const chunks = Array.from(
      { length: Math.ceil(globalSearchCandidates.length / 350) },
      (_, index) => globalSearchCandidates.slice(index * 350, index * 350 + 350),
    );
    Promise.all(chunks.map(async (chunk) => {
      const body = new URLSearchParams({
        where: `POA_CODE_2021 IN (${chunk.map((item) => `'${item.code}'`).join(",")})`,
        outFields: "POA_CODE_2021",
        returnGeometry: "false",
        f: "json",
      });
      const response = await fetch(
        "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/MapServer/0/query",
        { method: "POST", body, signal: controller.signal },
      );
      if (!response.ok) throw new Error("Postcode directory request failed");
      return response.json();
    })).then((results) => {
      if (controller.signal.aborted) return;
      setSearchDirectoryCodes(results.flatMap((result) =>
        (result.features || []).map((feature) => String(
          feature.attributes?.poa_code_2021 || feature.attributes?.POA_CODE_2021 || "",
        ).padStart(4, "0")),
      ));
    }).catch(() => {
      if (!controller.signal.aborted) setSearchDirectoryCodes([]);
    });
    return () => controller.abort();
  }, [globalSearchCandidates, localityLookup, query]);
  const searchMatches = useMemo(
    () => query.trim()
      ? searchDirectoryCodes
        ? globalSearchCandidates.filter((item) => searchDirectoryCodes.includes(item.code))
        : []
      : mappablePostcodes,
    [globalSearchCandidates, mappablePostcodes, query, searchDirectoryCodes],
  );
  const searchVerificationLoading = Boolean(
    query.trim() && globalSearchCandidates.length && searchDirectoryCodes === null,
  );
  const availableStates = useMemo(
    () =>
      [
        ...new Set(
          searchMatches
            .map((item) => item.state),
        ),
      ].sort((a, b) => (stateNames[a] || a).localeCompare(stateNames[b] || b)),
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
    setMapBoundaryCodes(null);
    setPage(1);
    setTable(item);
  };
  const selectPostcode = (item, source) => {
    const availableAreas = eligibilityIndex[item.code]?.areas || [];
    const targetTable = availableAreas.find((area) => area.id === table.id) || availableAreas[0];
    if (targetTable && targetTable.id !== table.id) {
      pendingSelectionRef.current = { item, source, tableId: targetTable.id };
      setMapBoundaryCodes(null);
      setDirectoryCodes(null);
      setTable(targetTable);
      return;
    }
    setSelectionSource(source);
    setSelected(item);
    window.setTimeout(() => {
      const isMobile = window.matchMedia("(max-width: 700px)").matches;
      const target = isMobile
        ? document.querySelector(".main-panel")
        : document.querySelector(".workspace");
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
    setSelected(null);
    setMapBoundaryCodes(null);
    setPage(1);
  };
  const changeJobFilter = (value) => {
    setJobFilter(value);
    setStateFilter("all");
    setMapBoundaryCodes(null);
    setPage(1);
  };
  const mapPostcodes = useMemo(() => {
    const candidates = jobFilter === "all" ? postcodes : jobPostcodes;
    return stateFilter === "all"
      ? candidates
      : candidates.filter((item) => item.state === stateFilter);
  }, [jobFilter, jobPostcodes, postcodes, stateFilter]);
  useEffect(() => {
    setMapBoundaryCodes(null);
  }, [mapPostcodes]);
  useEffect(() => {
    const controller = new AbortController();
    if (!localityLookup) {
      setDirectoryCodes(null);
      return () => controller.abort();
    }
    setDirectoryCodes(mapPostcodes.filter((item) => localityLookup[item.code]).map((item) => item.code));
    return () => controller.abort();
    const chunkSize = 350;
    const chunks = Array.from(
      { length: Math.ceil(mapPostcodes.length / chunkSize) },
      (_, index) => mapPostcodes.slice(index * chunkSize, index * chunkSize + chunkSize),
    );
    setDirectoryCodes(null);
    if (!chunks.length) {
      setDirectoryCodes([]);
      return () => controller.abort();
    }

    const loadDirectory = async () => {
      try {
        const results = await Promise.all(
          chunks.map(async (chunk) => {
            const codes = chunk.map((item) => `'${item.code}'`).join(",");
            const body = new URLSearchParams({
              where: `POA_CODE_2021 IN (${codes})`,
              outFields: "POA_CODE_2021",
              returnGeometry: "false",
              f: "json",
            });
            const response = await fetch(
              "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/MapServer/0/query",
              { method: "POST", body, signal: controller.signal },
            );
            if (!response.ok) throw new Error("Postcode directory request failed");
            return response.json();
          }),
        );
        if (controller.signal.aborted) return;
        setDirectoryCodes(
          results.flatMap((result) =>
            (result.features || []).map((feature) =>
              String(
                feature.attributes?.poa_code_2021 || feature.attributes?.POA_CODE_2021 || "",
              ).padStart(4, "0"),
            ),
          ),
        );
      } catch {
        if (!controller.signal.aborted) setDirectoryCodes([]);
      }
    };
    loadDirectory();
    return () => controller.abort();
  }, [localityLookup, mapPostcodes]);
  useEffect(() => {
    if (
      mapBoundaryCodes &&
      selected &&
      !mapBoundaryCodes.includes(selected.code)
    )
      setSelected(null);
  }, [mapBoundaryCodes, mappablePostcodes, selected]);

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span>Work &amp; Holiday Book</span>
        </div>
        <nav
          className={mobileMenuOpen ? "open" : ""}
          onClick={() => setMobileMenuOpen(false)}
        >
          <a
            className={activeView === "map" ? "active" : ""}
            onClick={() => navigateTo("map")}
          >
            Work map
          </a>
          <a
            className={activeView === "guide" ? "active" : ""}
            onClick={() => navigateTo("guide")}
          >
            Visa guide
          </a>
          <a
            className={activeView === "planner" ? "active" : ""}
            onClick={() => navigateTo("planner")}
          >
            88-day planner
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
      {activeView === "map" && (
        <section className="hero">
          <div className="hero-route" aria-hidden="true">
            <svg viewBox="0 0 420 230" fill="none">
              <path d="M26 177c48-82 97-91 141-43 40 43 85 25 108-18 25-47 68-58 120-35" />
              <circle cx="26" cy="177" r="5" />
              <circle cx="275" cy="116" r="5" />
              <path className="hero-route-arrow" d="m383 75 12 6-7 11" />
            </svg>
          </div>
          <div>
            <p className="eyebrow">WORK & HOLIDAY · SUBCLASS 462</p>
            <h1>
              Make your Australian
              <br />
              year <em>count.</em>
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
      )}
      {activeView === "map" ? (
        <section className="workspace">
          <aside className="sidebar">
            <div className="side-head">
              <div>
                <p className="eyebrow">POSTCODE EXPLORER</p>
                <h2>Where can I work?</h2>
              </div>
              <span className="count">
                {loadingTable || boundariesLoading ? "Loading…" : `${matches.length} areas`}
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
                  <span className="table-dot" style={{ background: item.accent }} />
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
                      <span className="postcode-place">{postcodePlace(item)}</span>
                      <span className="row-arrow">→</span>
                    </button>
                  ))}
                </section>
              ))}
              {(loadingTable || boundariesLoading || searchVerificationLoading) && (
                <p className="empty">Loading Table {table.number} postcodes…</p>
              )}
              {!loadingTable && !boundariesLoading && !searchVerificationLoading && !matches.length && (
                <p className="empty">
                  No matching postcodes for this work type.
                </p>
              )}
            </div>
            {!loadingTable && !boundariesLoading && !searchVerificationLoading && matches.length > 0 && (
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
              {boundariesLoading
                ? "Loading verified postcode directory…"
                : searchVerificationLoading
                ? "Checking matching postcode…"
                : matches.length
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
            {mapPostcodes.length > 0 && (
              <DeferredAustraliaMap
                key={`${table.id}-${jobFilter}-${stateFilter}`}
                table={table}
                postcodes={mapPostcodes}
                selected={selected}
                onSelect={(item) => selectPostcode(item, "map")}
                onBoundaryData={handleBoundaryData}
                focusZoom={selectionSource === "map" ? 7 : 9}
              />
            )}
            {!loadingTable && mapPostcodes.length === 0 && (
              <p className="empty main-panel-empty">
                No postcode boundaries match this state filter.
              </p>
            )}
            {selected && (
              <div className="detail-card">
                <div className="detail-top">
                  <div>
                    <p className="eyebrow">SELECTED POSTCODE</p>
                    <div className="selected-place">
                      <h2>{selected.code}</h2>
                      <span>
                        {postcodePlace(selected)},{" "}
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
      ) : activeView === "guide" ? (
        <VisaGuide />
      ) : (
        <Planner
          allPostcodes={allPostcodes}
          eligibilityIndex={eligibilityIndex}
          jobOptions={jobOptions}
          postcodePlace={postcodePlace}
        />
      )}
      <footer>
        <span>
          Work &amp; Holiday Book / your 462 visa companion
        </span>
        <span>
          Data guide updated 05 APR 2025 · Always verify before you start
        </span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
