import { useCallback, useEffect, useState } from "react";
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
        postcodeCode(a) === selectedCode ? -1 : postcodeCode(b) === selectedCode ? 1 : 0,
      );
      features.forEach((feature) => {
        const code = postcodeCode(feature);
        const point = map.latLngToContainerPoint(featureCentre(feature));
        const size = map.getSize();
        if (point.x < -30 || point.y < -20 || point.x > size.x + 30 || point.y > size.y + 20) return;
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

function ZoomWatcher({ onZoom }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  return null;
}

function MapFocus({ boundaries, selectedCode, focusZoom }) {
  const map = useMap();
  useEffect(() => {
    const feature = boundaries?.features.find((item) => postcodeCode(item) === selectedCode);
    if (!feature) return;
    const bounds = L.geoJSON(feature).getBounds();
    map.flyTo(bounds.getCenter(), focusZoom, { animate: true, duration: 0.7 });
  }, [boundaries, focusZoom, map, selectedCode]);
  return null;
}

export default function AustraliaMap({ table, postcodes, selected, onSelect, onBoundaryData, focusZoom }) {
  const [boundaries, setBoundaries] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [zoom, setZoom] = useState(4);
  const [visibleLabelCodes, setVisibleLabelCodes] = useState(new Set());
  // Geometry is deliberately simplified for the overview map. At this scale,
  // sub-100 m boundary detail is invisible but costs several megabytes.
  const geometryGeneralisation =
    postcodes.length > 1200 ? "0.006" : postcodes.length > 600 ? "0.0035" : "0.0015";

  useEffect(() => {
    const controller = new AbortController();
    const chunkSize = 350;
    const chunks = Array.from(
      { length: Math.ceil(postcodes.length / chunkSize) },
      (_, index) => postcodes.slice(index * chunkSize, index * chunkSize + chunkSize),
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
      try {
        for (let start = 0; start < chunks.length; start += 4) {
          const batch = chunks.slice(start, start + 4);
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
          setLoadingProgress({ loaded: Math.min(start + batch.length, chunks.length), total: chunks.length });
        }
        if (!results.some((result) => result.features?.length)) throw new Error("No postcode boundaries returned");
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      }
    };
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(loadBoundaries, { timeout: 900 })
      : window.setTimeout(loadBoundaries, 0);
    return () => {
      if (window.cancelIdleCallback && window.requestIdleCallback)
        window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      controller.abort();
    };
  }, [geometryGeneralisation, onBoundaryData, postcodes]);

  const selectedCode = selected?.code;
  const showPostcodeLabels = zoom >= 9;
  const isDenseMap = (boundaries?.features.length || 0) > 600;
  const updateVisibleLabels = useCallback((nextCodes) => {
    setVisibleLabelCodes((currentCodes) => {
      if (currentCodes.size === nextCodes.size && [...currentCodes].every((code) => nextCodes.has(code))) return currentCodes;
      return nextCodes;
    });
  }, []);
  const labelKey = [...visibleLabelCodes].sort().join(",");
  const style = (feature) => ({
    color: selectedCode ? (postcodeCode(feature) === selectedCode ? "#f2c94c" : "#3f8256") : "#b7c7bd",
    weight: postcodeCode(feature) === selectedCode ? 2.4 : 1,
    fillColor: postcodeCode(feature) === selectedCode ? "#67a978" : "#7fba8b",
    fillOpacity: selectedCode ? (postcodeCode(feature) === selectedCode ? 0.7 : 0.34) : 0,
  });
  const onEachFeature = (feature, layer) => {
    const code = postcodeCode(feature);
    const areaName = feature.properties.poa_name_2021;
    const tooltipName = areaName && areaName !== code ? areaName : "";
    const hasPermanentLabel = showPostcodeLabels && (visibleLabelCodes.has(code) || code === selectedCode);
    layer.bindTooltip(`<strong>${code}</strong>${hasPermanentLabel || !tooltipName ? "" : `<br/>${tooltipName}`}`, {
      sticky: !hasPermanentLabel,
      permanent: hasPermanentLabel,
      direction: "center",
      className: "postcode-map-label",
    });
    layer.on("click", () => onSelect(postcodes.find((item) => item.code === code)));
  };

  return (
    <div className="leaflet-wrap">
      <MapContainer center={[-25.1, 133.4]} zoom={4.5} zoomSnap={0.5} minZoom={4} maxZoom={10} maxBounds={[[-44.8, 111.5], [-8.2, 155.5]]} maxBoundsViscosity={1} scrollWheelZoom preferCanvas zoomControl={false} className="zone-map">
        <TileLayer attribution="&copy; OpenStreetMap contributors &copy; CARTO" url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" updateWhenIdle />
        <ZoomControl position="topright" />
        <ZoomWatcher onZoom={setZoom} />
        <MapFocus boundaries={boundaries} selectedCode={selectedCode} focusZoom={focusZoom} />
        {!isDenseMap && <LabelDensity boundaries={boundaries} selectedCode={selectedCode} onChange={updateVisibleLabels} />}
        {boundaries && <GeoJSON key={isDenseMap ? "dense-postcode-boundaries" : `${selectedCode}-${zoom}-${labelKey}`} data={boundaries} style={style} smoothFactor={isDenseMap ? 2.5 : 1} onEachFeature={onEachFeature} />}
      </MapContainer>
      <div className="map-intro">
        <span>TABLE {table.number}</span><strong>{table.label}</strong>
        <small>{isDenseMap ? "Choose a state or postcode to inspect a busy area" : showPostcodeLabels ? "Labels are reduced in dense areas — zoom in for more" : "Hover a boundary, or zoom in to show labels"}</small>
      </div>
      <div className="map-status">{loadError ? "Boundary data could not load — use postcode search." : boundaries ? `${boundaries.features.length} postcode boundaries loaded` : `Loading postcode boundaries… ${loadingProgress.loaded}/${loadingProgress.total}`}</div>
    </div>
  );
}
