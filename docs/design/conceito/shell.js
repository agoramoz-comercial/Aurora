const ICONS = {
  "Notícias": '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  "Aurora Chat": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  "Finanças": '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M16 13h2M3 9h15a3 3 0 0 0 3-3"/>',
  "Portfolio": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  "Analytics": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  "Corretoras": '<path d="M3 10h18L12 4zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  "Benchmark": '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>',
  "Plano": '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13l2 2 4-4"/>',
  "Modelo": '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
  "Marketplace": '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18"/>',
  "Definições": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
};
function topbar(active) {
  const areas = Object.entries(ICONS).map(([k, p]) =>
    `<span class="area ${k === active ? "on" : ""}"><svg viewBox="0 0 24 24">${p}</svg>${k === active ? k : ""}</span>`).join("");
  document.body.insertAdjacentHTML("afterbegin", `
  <header class="topbar">
    <div class="brand"><i></i>AURORA</div>
    <nav class="rail-areas">${areas}</nav>
    <div class="tools">
      <div class="mode"><span>Conservador</span><span class="on">Equilibrado</span><span>Dinâmico</span></div>
      <div class="kbd">Pesquisar <b>⌘K</b></div>
      <div class="clock num">24 nov · 09:41</div>
    </div>
  </header>`);
}
/* Instrument gauge (MBUX-style): 270° sweep, ticks, zones, marker, needle. */
function gauge(el, o) {
  const s = o.size, c = s / 2, r = s / 2 - 18, a0 = 135, sweep = 270;
  const ang = (v) => a0 + ((Math.min(Math.max(v, o.min), o.max) - o.min) / (o.max - o.min)) * sweep;
  const pt = (deg, rad) => [c + rad * Math.cos((deg * Math.PI) / 180), c + rad * Math.sin((deg * Math.PI) / 180)];
  const arc = (d0, d1, rad) => { const [x0, y0] = pt(d0, rad), [x1, y1] = pt(d1, rad); return `M${x0},${y0} A${rad},${rad} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1},${y1}`; };
  let ticks = "";
  for (let i = 0; i <= 30; i++) {
    const d = a0 + (sweep * i) / 30, big = i % 5 === 0;
    const [x0, y0] = pt(d, r - 10), [x1, y1] = pt(d, r - (big ? 22 : 16));
    ticks += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="rgba(255,255,255,${big ? 0.55 : 0.22})" stroke-width="${big ? 1.6 : 1}"/>`;
  }
  const zones = (o.zones || []).map((z) => `<path d="${arc(ang(z.from), ang(z.to), r)}" stroke="${z.color}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/>`).join("");
  const [mx0, my0] = o.marker != null ? pt(ang(o.marker), r + 6) : [0, 0];
  const [mx1, my1] = o.marker != null ? pt(ang(o.marker), r - 26) : [0, 0];
  const nd = ang(o.value), [nx, ny] = pt(nd, r + 4), [bx, by] = pt(nd, r - 40);
  const col = o.color || "var(--ambient)";
  el.innerHTML = `
  <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">
    <defs><radialGradient id="g${el.id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,255,255,.07)"/><stop offset="70%" stop-color="rgba(255,255,255,.015)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/></radialGradient>
    <filter id="f${el.id}"><feGaussianBlur stdDeviation="4"/></filter></defs>
    <circle cx="${c}" cy="${c}" r="${r + 10}" fill="url(#g${el.id})" stroke="rgba(255,255,255,.08)"/>
    <path d="${arc(a0, a0 + sweep, r)}" stroke="rgba(255,255,255,.08)" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${zones}
    <path d="${arc(a0, nd, r)}" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round" filter="url(#f${el.id})" opacity=".8"/>
    <path d="${arc(a0, nd, r)}" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${ticks}
    ${o.marker != null ? `<line x1="${mx0}" y1="${my0}" x2="${mx1}" y2="${my1}" stroke="#fff" stroke-width="2.5" stroke-dasharray="3 3"/>` : ""}
    <line x1="${bx}" y1="${by}" x2="${nx}" y2="${ny}" stroke="${col}" stroke-width="7" stroke-linecap="round" filter="url(#f${el.id})" opacity=".7"/>
    <line x1="${bx}" y1="${by}" x2="${nx}" y2="${ny}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  </svg>
  <div class="g-center"><div class="g-val display num" style="font-size:${o.font || 34}px">${o.text}</div><div class="g-lab">${o.label}</div>${o.sub ? `<div class="g-sub num">${o.sub}</div>` : ""}</div>`;
}
