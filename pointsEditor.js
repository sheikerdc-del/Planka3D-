// pointsEditor.js
import { $, clientToSVG, round1 } from "./utils.js";
import { getLA, setLA, pointsFromLA } from "./model.js";

const pointState = { pts: [], draggingIdx: -1 };

function redrawPointCanvas() {
  const svg = $("#pointCanvas"); if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const vbw = svg.viewBox.baseVal.width || 800;
  const vbh = svg.viewBox.baseVal.height || 360;

  for (let x = 0; x <= vbw; x += 50) {
    const l = document.createElementNS(svg.namespaceURI, "line");
    l.setAttribute("x1", x); l.setAttribute("y1", 0); l.setAttribute("x2", x); l.setAttribute("y2", vbh);
    l.setAttribute("stroke", "#2a3558"); l.setAttribute("opacity", "0.4"); svg.appendChild(l);
  }
  for (let y = 0; y <= vbh; y += 50) {
    const l = document.createElementNS(svg.namespaceURI, "line");
    l.setAttribute("x1", 0); l.setAttribute("y1", y); l.setAttribute("x2", vbw); l.setAttribute("y2", y);
    l.setAttribute("stroke", "#2a3558"); l.setAttribute("opacity", "0.4"); svg.appendChild(l);
  }

  if (pointState.pts.length >= 2) {
    const pl = document.createElementNS(svg.namespaceURI, "polyline");
    pl.setAttribute("fill", "none"); pl.setAttribute("stroke", "#5bc0be"); pl.setAttribute("stroke-width", "2");
    pl.setAttribute("points", pointState.pts.map(p => `${p.x},${p.y}`).join(" "));
    svg.appendChild(pl);
  }

  pointState.pts.forEach((p, idx) => {
    const c = document.createElementNS(svg.namespaceURI, "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 5);
    c.setAttribute("fill", idx === pointState.draggingIdx ? "#fca311" : "#e9eef7");
    c.setAttribute("stroke", "#22315e"); c.setAttribute("stroke-width", "1");
    c.style.cursor = "pointer";
    c.addEventListener("mousedown", () => { pointState.draggingIdx = idx; });
    svg.appendChild(c);
  });

  const tbody = $("#pointsTable");
  tbody.innerHTML = "";
  for (let i = 0; i < Math.max(0, pointState.pts.length - 1); i++) {
    const a = pointState.pts[i], b = pointState.pts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    let angle = "—";
    if (i < pointState.pts.length - 2) {
      const c = pointState.pts[i + 2];
      const v1 = { x: dx, y: dy };
      const v2 = { x: c.x - b.x, y: c.y - b.y };
      const ang1 = Math.atan2(v1.y, v1.x);
      const ang2 = Math.atan2(v2.y, v2.x);
      let delta = (ang2 - ang1) * 180 / Math.PI;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      angle = round1(delta);
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${round1(L)}</td><td>${angle}</td>`;
    tbody.appendChild(tr);
  }
}

function bindHandlers() {
  const svg = $("#pointCanvas"); if (!svg) return;

  svg.addEventListener("contextmenu", e => {
    e.preventDefault();
    pointState.pts.pop();
    pointState.draggingIdx = -1;
    redrawPointCanvas();
  });

  svg.addEventListener("mousedown", e => {
    if (e.button === 0) {
      const p = clientToSVG(svg, e.clientX, e.clientY);
      const hit = pointState.pts.findIndex(q => Math.hypot(q.x - p.x, q.y - p.y) < 8);
      if (hit === -1) {
        pointState.pts.push(p);
        redrawPointCanvas();
      } else {
        pointState.draggingIdx = hit;
      }
    }
  });

  window.addEventListener("mousemove", e => {
    if (pointState.draggingIdx >= 0) {
      const p = clientToSVG(svg, e.clientX, e.clientY);
      const vb = svg.viewBox.baseVal;
      p.x = Math.max(0, Math.min(p.x, vb.width));
      p.y = Math.max(0, Math.min(p.y, vb.height));
      pointState.pts[pointState.draggingIdx] = p;
      redrawPointCanvas();
    }
  });
  window.addEventListener("mouseup", () => { pointState.draggingIdx = -1; });
}

export function applyPointsToProfile() {
  if (pointState.pts.length < 2) return;
  const Larr = [];
  const Aarr = [];
  for (let i = 0; i < pointState.pts.length - 1; i++) {
    const a = pointState.pts[i], b = pointState.pts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    Larr.push(Math.max(0, Math.round(L)));
    if (i < pointState.pts.length - 2) {
      const c = pointState.pts[i + 2];
      const v1 = { x: dx, y: dy };
      const v2 = { x: c.x - b.x, y: c.y - b.y };
      const ang1 = Math.atan2(v1.y, v1.x);
      const ang2 = Math.atan2(v2.y, v2.x);
      let delta = (ang2 - ang1) * 180 / Math.PI;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      Aarr.push(Math.round(delta));
    }
  }
  setLA(Larr, Aarr);
}

export function importProfileToPoints() {
  const svg = $("#pointCanvas");
  const vb = svg.viewBox.baseVal;
  const origin = { x: 40, y: vb.height - 40 };
  const { Ls, As } = getLA();
  const pts = pointsFromLA(Ls, As, origin);
  pointState.pts = pts;
  redrawPointCanvas();
}

export function clearPoints() { pointState.pts = []; redrawPointCanvas(); }
export function initPointsEditor() { bindHandlers(); redrawPointCanvas(); }
