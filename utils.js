// utils.js
export const $ = (id) => document.getElementById(id);
export const round1 = (v) => Math.round((Number(v) || 0) * 10) / 10;
export const round3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;

export function clientToSVG(svg, clientX, clientY) {
  const pt = new DOMPoint(clientX, clientY);
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const inv = m.inverse();
  const loc = pt.matrixTransform(inv);
  return { x: loc.x, y: loc.y };
}

export function svgDownload(name, svgEl) {
  const src = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
