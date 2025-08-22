import { $, clientToSVG, round1 } from "./utils.js";
import { getLA, setLA, pointsFromLA } from "./model.js";

let state = { points: [] };
let svgEl = null;
let tableEl = null;
let dragIdx = -1;

export function initPointsEditor(svg, tbody) {
  svgEl = svg; tableEl = tbody;
  state.points = [];
  render();
  bind();
}

function bind() {
  if (!svgEl) return;
  svgEl.addEventListener("mousedown", onDown);
  svgEl.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  svgEl.addEventListener("contextmenu", e => { e.preventDefault(); removeLast(); });
}

function onDown(e) {
  const p = clientToSVG(svgEl, e.clientX, e.clientY);
  const idx = hitPoint(p);
  if (idx >= 0) {
    dragIdx = idx;
  } else {
    state.points.push(p);
    dragIdx = state.points.length - 1;
    render();
  }
}

function onMove(e) {
  if (dragIdx < 0) return;
  const p = clientToSVG(svgEl, e.clientX, e.clientY);
  state.points[dragIdx] = p;
  render();
}

function onUp() { dragIdx = -1; }

function hitPoint(p) {
  for (let i = 0; i < state.points.length; i++) {
    const q = state.points[i];
    const dx = q.x - p.x, dy = q.y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) < 10) return i;
  }
  return -1;
}

function removeLast() {
  if (state.points.length > 0) state.points.pop();
  render();
}

function render() {
  if (!svgEl) return;
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  const pad = 10, vbw = svgEl.viewBox.baseVal.width || 800, vbh = svgEl.viewBox.baseVal.height || 360;

  const ax = document.createElementNS(svgEl.namespaceURI, "line");
  ax.setAttribute("x1", pad); ax.setAttribute("y1", vbh - pad);
  ax.setAttribute("x2", vbw - pad); ax.setAttribute("y2", vbh - pad);
  ax.setAttribute("stroke", "#2a3558"); svgEl.appendChild(ax);

  if (state.points.length >= 1) {
    const poly = document.createElementNS(svgEl.namespaceURI, "polyline");
    poly.setAttribute("points", state.points.map(p => `${p.x},${p.y}`).join(" "));
    poly.setAttribute("fill", "none"); poly.setAttribute("stroke", "#6ad1b8"); poly.setAttribute("stroke-width", "2");
    svgEl.appendChild(poly);
  }

  state.points.forEach((p, i) => {
    const c = document.createElementNS(svgEl.namespaceURI, "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", "5");
    c.setAttribute("fill", "#f7b267"); svgEl.appendChild(c);

    const t = document.createElementNS(svgEl.namespaceURI, "text");
    t.setAttribute("x", p.x + 8); t.setAttribute("y", p.y - 8);
    t.setAttribute("fill", "#e8ecff"); t.setAttribute("font-size", "12");
    t.textContent = `#${i + 1}`; svgEl.appendChild(t);
  });

  renderTable();
}

function renderTable() {
  if (!tableEl) return;
  tableEl.innerHTML = "";
  for (let i = 0; i < Math.max(0, state.points.length - 1); i++) {
    const p = state.points[i], q = state.points[i + 1];
    const dx = q.x - p.x, dy = q.y - p.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${round1(L)}</td><td>${round1(ang)}</td>`;
    tableEl.appendChild(tr);
  }
}

export function applyPointsToProfile() {
  if (state.points.length < 2) return;
  const Ls = [], As = [];
  for (let i = 0; i < state.points.length - 1; i++) {
    const p = state.points[i], q = state.points[i + 1];
    const dx = q.x - p.x, dy = q.y - p.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    Ls.push(Math.max(0, L));
  }
  for (let i = 1; i < state.points.length - 1; i++) {
    const p0 = state.points[i - 1], p1 = state.points[i], p2 = state.points[i + 1];
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const a1 = Math.atan2(v1.y, v1.x);
    const a2 = Math.atan2(v2.y, v2.x);
    const d = (a2 - a1) * 180 / Math.PI;
    As.push(d);
  }
  setLA(Ls, As);
}

export function importProfileToPoints() {
  const { Ls, As } = getLA();
  const raw = pointsFromLA(Ls, As, { x: 40, y: (svgEl?.viewBox.baseVal.height || 360) - 40 });
  state.points = raw;
  render();
}

export function clearPoints() {
  state.points = [];
  render();
}
