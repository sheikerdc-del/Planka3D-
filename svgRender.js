import { $, round1, svgDownload } from "./utils.js";
import { pointsFromLA } from "./model.js";

export function drawCross(model, svg) {
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const vbw = svg.viewBox.baseVal.width || 700, vbh = svg.viewBox.baseVal.height || 360, pad = 24;

  for (let x = pad; x <= vbw - pad; x += 50) {
    const l = document.createElementNS(svg.namespaceURI, "line");
    l.setAttribute("x1", x); l.setAttribute("y1", pad); l.setAttribute("x2", x); l.setAttribute("y2", vbh - pad);
    l.setAttribute("stroke", "#2a3558"); l.setAttribute("opacity", "0.35"); svg.appendChild(l);
  }
  for (let y = pad; y <= vbh - pad; y += 50) {
    const l = document.createElementNS(svg.namespaceURI, "line");
    l.setAttribute("x1", pad); l.setAttribute("y1", y); l.setAttribute("x2", vbw - pad); l.setAttribute("y2", y);
    l.setAttribute("stroke", "#2a3558"); l.setAttribute("opacity", "0.35"); svg.appendChild(l);
  }

  const raw = pointsFromLA(model.Ls, model.As, { x: pad + 40, y: vbh - pad - 40 });
  const minX = Math.min(...raw.map(p => p.x)), maxX = Math.max(...raw.map(p => p.x));
  const minY = Math.min(...raw.map(p => p.y)), maxY = Math.max(...raw.map(p => p.y));
  const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
  const s = Math.min((vbw - 2 * pad) / w, (vbh - 2 * pad) / h);
  const offX = (vbw - w * s) / 2 - minX * s, offY = (vbh - h * s) / 2 - minY * s;
  const pts = raw.map(p => ({ x: p.x * s + offX, y: p.y * s + offY }));

  const pl = document.createElementNS(svg.namespaceURI, "polyline");
  pl.setAttribute("fill", "none"); pl.setAttribute("stroke", "#f09642"); pl.setAttribute("stroke-width", "2");
  pl.setAttribute("points", pts.map(p => `${p.x},${p.y}`).join(" ")); svg.appendChild(pl);

  for (let i = 0; i < pts.length - 1; i++) {
    const mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
    const t = document.createElementNS(svg.namespaceURI, "text");
    t.setAttribute("x", mid.x + 6); t.setAttribute("y", mid.y - 6);
    t.setAttribute("fill", "#e8ecff"); t.setAttribute("font-size", "12");
    t.textContent = `L${i + 1}=${round1(model.Ls[i])}`; svg.appendChild(t);

    if (i < model.As.length) {
      const tb = document.createElementNS(svg.namespaceURI, "text");
      tb.setAttribute("x", pts[i + 1].x + 6); tb.setAttribute("y", pts[i + 1].y - 6);
      tb.setAttribute("fill", "#9ed0ff"); tb.setAttribute("font-size", "11");
      tb.textContent = `∠${i + 1}=${round1(model.As[i])}°`; svg.appendChild(tb);
    }
  }
}

export function drawFlat(model, svg) {
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const vb = svg.viewBox.baseVal; const VBW = vb.width || 820; const VBH = vb.height || 360; const pad = 24;

  const lenX = 2000; const widY = Math.max(1, model.width);
  const s = Math.min((VBW - 2 * pad) / lenX, (VBH - 2 * pad) / widY);
  const baseX = pad; const baseBottom = VBH - pad;

  const rect = document.createElementNS(svg.namespaceURI, "rect");
  rect.setAttribute("x", baseX); rect.setAttribute("y", baseBottom - widY * s);
  rect.setAttribute("width", (lenX * s).toFixed(2)); rect.setAttribute("height", (widY * s).toFixed(2));
  rect.setAttribute("fill", "#e9eef7"); rect.setAttribute("stroke", "#335089"); rect.setAttribute("stroke-width", "1.2");
  svg.appendChild(rect);

  const txt = document.createElementNS(svg.namespaceURI, "text");
  txt.setAttribute("x", baseX + 8); txt.setAttribute("y", baseBottom - widY * s - 8);
  txt.setAttribute("fill", "#e8ecff"); txt.setAttribute("font-size", "12");
  txt.textContent = `Полоса: 2000 × ${round1(model.width)} мм`;
  svg.appendChild(txt);
}

export function renderWidthInfo(model, el) {
  if (!el) return;
  const parts = model.elements.map(e => (e.type === "hem" ? `${e.name}:15 (завальцовка)` : `${e.name}:${round1(e.L)}`)).join(" · ");
  const bendList = model.blPos.map((v, i) => `${model.bendNames[i]}=${round1(v)} мм`).join(" · ");
  el.innerHTML = [
    `Ширина (Σ${model.useHem ? " + завальцовка" : ""}): <b>${round1(model.width)} мм</b>`,
    `Элементы: <b>${parts || "—"}</b>`,
    `ЛГ (от нижней кромки): <b>${bendList || "—"}</b>`
  ].map(s => `<div>${s}</div>`).join("");
}

export function buildLayoutTable(model, el) {
  if (!el) return;
  const lines = [];
  lines.push("Метка Позиция ЛГ (мм от нижней кромки)    Примечание");
  lines.push("----- -------------------------------      ----------");
  if (model.blPos.length === 0) {
    lines.push("—     —                                    нет линий гиба");
  } else {
    for (let i = 0; i < model.blPos.length; i++) {
      const pos = model.blPos[i];
      lines.push(`${String(model.bendNames[i]).padEnd(5)} ${String(pos.toFixed(2)).padEnd(31)}      линия гиба`);
    }
  }
  el.textContent = lines.join("\n");
}

export function exportProfileSVG() { const el = $("#cross"); if (el) svgDownload("profile.svg", el); }
export function exportFlatSVG() { const el = $("#flat"); if (el) svgDownload("strip.svg", el); }

export function exportProductionSVG(model, report) {
  if (!report) { alert("Заполните все параметры цены и выберите категорию"); return; }
  const svgNS = "http://www.w3.org/2000/svg";
  const w = 1400, h = 820, pad = 24;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("xmlns", svgNS);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`); svg.setAttribute("width", w); svg.setAttribute("height", h);

  const title = document.createElementNS(svgNS, "text");
  title.setAttribute("x", pad); title.setAttribute("y", pad + 14);
  title.setAttribute("font-size", "16"); title.setAttribute("font-weight", "700");
  title.textContent = "Чертёж: профиль, раскрой и спецификация"; svg.appendChild(title);

  const area1 = { x: pad, y: pad + 28, w: 700, h: 340 };
  const border1 = document.createElementNS(svgNS, "rect");
  border1.setAttribute("x", area1.x); border1.setAttribute("y", area1.y);
  border1.setAttribute("width", area1.w); border1.setAttribute("height", area1.h);
  border1.setAttribute("fill", "#ffffff"); border1.setAttribute("stroke", "#1a2c5a"); border1.setAttribute("stroke-width", "1");
  svg.appendChild(border1);

  const rawPts = pointsFromLA(model.Ls, model.As, { x: 0, y: 0 });
  const minX = Math.min(...rawPts.map(p => p.x)), maxX = Math.max(...rawPts.map(p => p.x));
  const minY = Math.min(...rawPts.map(p => p.y)), maxY = Math.max(...rawPts.map(p => p.y));
  const w1 = Math.max(1, maxX - minX), h1 = Math.max(1, maxY - minY);
  const s1 = Math.min((area1.w - 40) / w1, (area1.h - 40) / h1);
  const offX1 = area1.x + (area1.w - w1 * s1) / 2 - minX * s1;
  const offY1 = area1.y + (area1.h - h1 * s1) / 2 - minY * s1;
  const pts1 = rawPts.map(p => ({ x: p.x * s1 + offX1, y: p.y * s1 + offY1 }));

  const pl1 = document.createElementNS(svgNS, "polyline");
  pl1.setAttribute("fill", "none"); pl1.setAttribute("stroke", "#0b1020"); pl1.setAttribute("stroke-width", "1.8");
  pl1.setAttribute("points", pts1.map(p => `${p.x},${p.y}`).join(" "));
  svg.appendChild(pl1);

  for (let i = 0; i < pts1.length - 1; i++) {
    const mid = { x: (pts1[i].x + pts1[i + 1].x) / 2, y: (pts1[i].y + pts1[i + 1].y) / 2 };
    const t = document.createElementNS(svgNS, "text");
    t.setAttribute("x", mid.x + 6); t.setAttribute("y", mid.y - 6);
    t.setAttribute("font-size", "12"); t.textContent = `L${i + 1}=${round1(model.Ls[i])} мм`; svg.appendChild(t);

    if (i < model.As.length) {
      const tb = document.createElementNS(svgNS, "text");
      tb.setAttribute("x", pts1[i + 1].x + 6); tb.setAttribute("y", pts1[i + 1].y - 6);
      tb.setAttribute("font-size", "12"); tb.setAttribute("fill", "#1b3d8a");
      tb.textContent = `∠${i + 1}=${round1(model.As[i])}°`; svg.appendChild(tb);
    }
  }

  const area2 = { x: pad + area1.w + 20, y: area1.y, w: w - (pad + area1.w + 20) - pad, h: area1.h };
  const border2 = document.createElementNS(svgNS, "rect");
  border2.setAttribute("x", area2.x); border2.setAttribute("y", area2.y);
  border2.setAttribute("width", area2.w); border2.setAttribute("height", area2.h);
  border2.setAttribute("fill", "#ffffff"); border2.setAttribute("stroke", "#1a2c5a"); border2.setAttribute("stroke-width", "1");
  svg.appendChild(border2);

  const lenX = 2000, widY = Math.max(1, model.width);
  const s2 = Math.min((area2.w - 40) / lenX, (area2.h - 40) / widY);
  const left2 = area2.x + (area2.w - lenX * s2) / 2;
  const top2 = area2.y + (area2.h - widY * s2) / 2;

  const rect2 = document.createElementNS(svgNS, "rect");
  rect2.setAttribute("x", left2.toFixed(2)); rect2.setAttribute("y", top2.toFixed(2));
  rect2.setAttribute("width", (lenX * s2).toFixed(2)); rect2.setAttribute("height", (widY * s2).toFixed(2));
  rect2.setAttribute("fill", "#f4f7ff"); rect2.setAttribute("stroke", "#1a2c5a"); rect2.setAttribute("stroke-width", "1.2");
  svg.appendChild(rect2);

  const label2 = document.createElementNS(svgNS, "text");
  label2.setAttribute("x", left2 + 6); label2.setAttribute("y", top2 - 8); label2.setAttribute("font-size", "12");
  label2.textContent = `Полоса: 2000 × ${round1(model.width)} мм`;
  svg.appendChild(label2);

  const src = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "production.svg"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
