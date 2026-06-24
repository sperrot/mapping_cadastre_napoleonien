/* ------------------------------------------------------------------ *
 * Cadastre napoléonien — V0.0 « Annuaire cartographié »
 *
 * - Carte : MapLibre GL JS (fond OSM raster, sans clé d'API)
 * - Communes : API officielle geo.api.gouv.fr (recherche + contours,
 *   aucune donnée à héberger)
 * - Liens d'archives : table `document` lue dans Supabase (lecture seule)
 *
 * La contribution (ajout de liens) arrive au palier V0.1.
 * ------------------------------------------------------------------ */

const GEO_API = "https://geo.api.gouv.fr/communes";
const COMMUNE_FIELDS = "nom,code,codeDepartement,centre,contour";

/* --- Supabase (optionnel en V0.0 : la carte marche sans) --- */
const sb =
  window.CONFIG && window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_ANON_KEY
    ? window.supabase.createClient(
        window.CONFIG.SUPABASE_URL,
        window.CONFIG.SUPABASE_ANON_KEY
      )
    : null;

/* --- Carte --- */
const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  },
  center: [2.5, 46.6], // France métropolitaine
  zoom: 5,
});
map.addControl(new maplibregl.NavigationControl(), "top-right");

/* Source + couches pour le contour de la commune sélectionnée */
map.on("load", () => {
  map.addSource("commune", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: "commune-fill",
    type: "fill",
    source: "commune",
    paint: { "fill-color": "#8a5a2b", "fill-opacity": 0.12 },
  });
  map.addLayer({
    id: "commune-line",
    type: "line",
    source: "commune",
    paint: { "line-color": "#8a5a2b", "line-width": 2 },
  });
});

/* --- Sélection d'une commune (objet { nom, code, codeDepartement, centre, contour }) --- */
async function selectCommune(c) {
  hideResults();
  searchInput.value = c.nom;

  if (c.contour && map.getSource("commune")) {
    map.getSource("commune").setData({
      type: "Feature",
      geometry: c.contour,
      properties: {},
    });
    const b = new maplibregl.LngLatBounds();
    eachCoord(c.contour, ([lng, lat]) => b.extend([lng, lat]));
    map.fitBounds(b, { padding: 40, maxZoom: 14 });
  } else if (c.centre) {
    map.flyTo({ center: c.centre.coordinates, zoom: 13 });
  }

  renderCommune(c, null, true); // état "chargement"
  const docs = await fetchDocuments(c.code);
  renderCommune(c, docs, false);
}

/* --- Lecture des liens d'archives dans Supabase --- */
async function fetchDocuments(insee) {
  if (!sb) return null; // Supabase non configuré
  const { data, error } = await sb
    .from("document")
    .select("type, section_lettre, feuille_num, annee, cote, archive_url, iiif_manifest, licence_overlay_ok, source, source_url, statut")
    .eq("insee", insee)
    .order("type")
    .order("section_lettre", { nullsFirst: true })
    .order("feuille_num", { nullsFirst: true });
  if (error) {
    console.error("Supabase:", error.message);
    return null;
  }
  return data;
}

/* ------------------------------------------------------------------ *
 * Rendu de la fiche commune
 * ------------------------------------------------------------------ */
const TYPE_LABEL = {
  tableau_assemblage: "Tableau d'assemblage",
  section: "Sections",
  feuille: "Feuilles",
};
const TYPE_ORDER = ["tableau_assemblage", "section", "feuille"];

function renderCommune(c, docs, loading) {
  const el = document.getElementById("commune-info");
  el.classList.remove("placeholder");

  let html = `
    <h2 class="commune-title">${escape(c.nom)}</h2>
    <p class="commune-sub">INSEE ${escape(c.code)} · département ${escape(
    c.codeDepartement || c.code.slice(0, 2)
  )}</p>`;

  if (loading) {
    html += `<p class="empty-state">Recherche des plans disponibles…</p>`;
  } else if (docs === null) {
    html += `<div class="empty-state">
      <strong>Base de liens non connectée.</strong><br>
      Renseignez Supabase dans <code>config.js</code> pour afficher les plans,
      ou ouvrez directement le portail d'archives du département.
    </div>`;
  } else if (docs.length === 0) {
    html += `<div class="empty-state">
      <strong>Aucun plan référencé pour cette commune.</strong><br>
      La contribution participative (ajout de liens) arrive au palier V0.1.
    </div>`;
  } else {
    for (const type of TYPE_ORDER) {
      const group = docs.filter((d) => d.type === type);
      if (!group.length) continue;
      html += `<div class="doc-group"><h3>${TYPE_LABEL[type] || type}</h3>`;
      for (const d of group) html += docItem(d);
      html += `</div>`;
    }
    html += sourceFooter(docs);
  }
  el.innerHTML = html;
  if (!loading && Array.isArray(docs) && docs.length) hydrateGeoref(el);
}

/* ------------------------------------------------------------------ *
 * Géoréférencement via Allmaps (zéro infra : Allmaps stocke + rend)
 *
 * - Détection : generateId(manifeste) → annotations.allmaps.org/manifests/{id}
 * - Déjà calé   → badge + lien Allmaps Viewer (se centre seul sur l'emprise)
 * - Pas calé    → bouton vers Allmaps Editor, manifeste IIIF pré-saisi
 * Aucune annotation n'est stockée chez nous en V1 (cf. dump open-data Allmaps
 * pour un mirroring ultérieur si besoin de curation).
 * ------------------------------------------------------------------ */
const editorLink = (manifest) =>
  `https://editor.allmaps.org/?url=${encodeURIComponent(manifest)}`;
const viewerLink = (annotationUrl) =>
  `https://viewer.allmaps.org/?url=${encodeURIComponent(annotationUrl)}`;

// `@allmaps/id` chargé en import() dynamique → app.js reste un script classique.
// Variant `/sync` (SHA-1 pur-JS) : pas de SubtleCrypto, marche aussi en file://.
let allmapsIdMod = null;
const loadAllmapsId = () =>
  (allmapsIdMod ||= import("https://esm.run/@allmaps/id/sync"));

// manifeste → URL d'annotation (ou null si pas encore géoréférencé). Mis en cache.
const annotationCache = new Map();
async function resolveAnnotation(manifest) {
  if (annotationCache.has(manifest)) return annotationCache.get(manifest);
  let result = null;
  try {
    const { generateId } = await loadAllmapsId();
    const id = await generateId(manifest);
    const url = `https://annotations.allmaps.org/manifests/${id}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if ((data.items?.length ?? 0) > 0) result = url;
    }
  } catch (e) {
    console.warn("Allmaps:", e); // hors-ligne / API down → on propose d'éditer
  }
  annotationCache.set(manifest, result);
  return result;
}

async function hydrateGeoref(root) {
  for (const block of root.querySelectorAll(".georef[data-manifest]")) {
    const manifest = block.dataset.manifest;
    const annotationUrl = await resolveAnnotation(manifest);
    if (!block.isConnected) return; // commune changée pendant le fetch
    block.innerHTML = annotationUrl
      ? `<span class="georef-badge">✓ géoréférencé</span>
         <a class="georef-link" href="${escape(
           viewerLink(annotationUrl)
         )}" target="_blank" rel="noopener">Voir l'overlay ↗</a>`
      : `<a class="georef-btn" href="${escape(
          editorLink(manifest)
        )}" target="_blank" rel="noopener">Géoréférencer ce plan ↗</a>`;
  }
}

/* Mention d'attribution (CRPA) : une ligne par source distincte. */
function sourceFooter(docs) {
  const seen = new Map();
  for (const d of docs) {
    if (d.source && !seen.has(d.source)) seen.set(d.source, d.source_url);
  }
  if (!seen.size) return "";
  const items = [...seen]
    .map(([name, url]) =>
      url
        ? `<a href="${escape(url)}" target="_blank" rel="noopener">${escape(name)}</a>`
        : escape(name)
    )
    .join(", ");
  return `<p class="source-note">Source : ${items}</p>`;
}

function docItem(d) {
  let label = "Plan";
  if (d.type === "section")
    label = d.section_lettre ? `Section ${d.section_lettre}` : (d.cote || "Section");
  else if (d.type === "feuille")
    label = d.section_lettre
      ? `Section ${d.section_lettre} — feuille ${d.feuille_num ?? "?"}`
      : (d.cote || "Feuille");
  else if (d.type === "tableau_assemblage") label = "Tableau d'assemblage";

  // cote en meta si elle ne sert pas déjà de libellé
  const metaParts = [d.annee];
  if (label !== d.cote) metaParts.push(d.cote);
  const meta = metaParts.filter(Boolean).join(" · ");
  let html = `<div class="doc-item">
    <a href="${escape(d.archive_url)}" target="_blank" rel="noopener">${escape(
    label
  )} ↗</a>
    ${meta ? `<span class="meta">${escape(meta)}</span>` : ""}
  </div>`;

  // Géoréférencement Allmaps : seulement sur l'assemblage, avec manifeste IIIF,
  // et uniquement si la licence autorise l'overlay (règle CRPA). Le statut réel
  // (déjà géoréférencé ou non) est résolu en asynchrone par hydrateGeoref().
  if (d.type === "tableau_assemblage" && d.iiif_manifest && d.licence_overlay_ok) {
    html += `<div class="georef" data-manifest="${escape(d.iiif_manifest)}">
      <span class="georef-loading">Vérification du géoréférencement…</span>
    </div>`;
  }
  return html;
}

/* ------------------------------------------------------------------ *
 * Recherche par nom (autocomplete sur geo.api.gouv.fr)
 * ------------------------------------------------------------------ */
const searchInput = document.getElementById("search-input");
const resultsEl = document.getElementById("search-results");
let searchTimer = null;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (q.length < 2) return hideResults();
  searchTimer = setTimeout(() => runSearch(q), 220);
});

async function runSearch(q) {
  const url = `${GEO_API}?nom=${encodeURIComponent(
    q
  )}&fields=${COMMUNE_FIELDS}&boost=population&limit=8`;
  try {
    const res = await fetch(url);
    const communes = await res.json();
    showResults(communes);
  } catch (e) {
    console.error("geo.api.gouv.fr:", e);
  }
}

function showResults(communes) {
  if (!communes.length) return hideResults();
  resultsEl.innerHTML = communes
    .map(
      (c) =>
        `<li data-code="${c.code}">${escape(c.nom)} <span class="dep">(${
          c.codeDepartement || ""
        })</span></li>`
    )
    .join("");
  resultsEl.hidden = false;
  resultsEl.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const c = communes.find((x) => x.code === li.dataset.code);
      if (c) selectCommune(c);
    });
  });
}

function hideResults() {
  resultsEl.hidden = true;
  resultsEl.innerHTML = "";
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search")) hideResults();
});

/* ------------------------------------------------------------------ *
 * Clic sur la carte → commune au point (recherche géographique inverse)
 * ------------------------------------------------------------------ */
map.on("click", async (e) => {
  const { lng, lat } = e.lngLat;
  const url = `${GEO_API}?lat=${lat}&lon=${lng}&fields=${COMMUNE_FIELDS}`;
  try {
    const res = await fetch(url);
    const communes = await res.json();
    if (communes.length) selectCommune(communes[0]);
  } catch (err) {
    console.error("geo.api.gouv.fr (clic):", err);
  }
});

/* ------------------------------------------------------------------ *
 * Utilitaires
 * ------------------------------------------------------------------ */
function eachCoord(geometry, fn) {
  const walk = (a) => {
    if (typeof a[0] === "number") fn(a);
    else a.forEach(walk);
  };
  walk(geometry.coordinates);
}

function escape(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}
