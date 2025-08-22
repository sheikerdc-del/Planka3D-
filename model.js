// model.js
import { $ } from "./utils.js";

const HEM_SIZE = 15;
let Ls = [30, 100, 20, 15];
let As = [-90, -90, 0];
const listeners = new Set();

export function getLA() { return { Ls: [...Ls], As: [...As] }; }
export function setLA(Larr, Aarr) {
  Ls = [...Larr].map(n => Math.max(0, Number(n) || 0));
  As = [...Aarr].slice(0, Math.max(0, Ls.length - 1)).map(n => Number(n) || 0);
  emit();
}
export function updateL(i, v) {
  Ls[i] = Math.max(0, Number(v) || 0);
  As = As.slice(0, Math.max(0, Ls.length - 1));
  emit();
}
export function updateA(i, v) {
  if (i >= 0 && i < Ls.length - 1) As[i] = Number(v) || 0;
  emit();
}
export function addFlange() { Ls.push(10); if (Ls.length > 1) As.push(0); emit(); }
export function removeFlange() { if (Ls.length > 0) Ls.pop(); As = As.slice(0, Math.max(0, Ls.length - 1)); emit(); }

export function onChange(cb) { listeners.add(cb); }
export function offChange(cb) { listeners.delete(cb); }
function emit() { listeners.forEach(cb => cb(buildModel())); }

export function pointsFromLA(Larr, Aarr, origin = { x: 0, y: 0 }) {
  const pts = [{ x: origin.x, y: origin.y }];
  let ang = -90;
  for (let i = 0; i < Larr.length; i++) {
    const L = Number(Larr[i]) || 0;
    const p = pts[pts.length - 1];
    const nx = p.x + L * Math.cos((ang * Math.PI) / 180);
    const ny = p.y + L * Math.sin((ang * Math.PI) / 180);
    pts.push({ x: nx, y: ny });
    if (i < Aarr.length) ang += Number(Aarr[i]) || 0;
  }
  return pts;
}

export function buildModel() {
  const useHem = $("#useHem")?.checked ?? false;
  const side = $("#hemSide")?.value || "bottom";
  const elements = [];
  if (useHem && side === "bottom") elements.push({ type: "hem", L: HEM_SIZE });
  for (let i = 0; i < Ls.length; i++) elements.push({ type: "seg", idx: i, L: Math.max(0, Number(Ls[i]) || 0) });
  if (useHem && side === "top") elements.push({ type: "hem", L: HEM_SIZE });

  const names = Array.from({ length: elements.length }, (_, i) => String.fromCharCode(65 + i));
  elements.forEach((el, i) => (el.name = names[i]));

  const segNameMap = new Array(Ls.length);
  const shift = (useHem && (side === "bottom")) ? 1 : 0;
  for (let i = 0; i < Ls.length; i++) segNameMap[i] = names[i + shift];

  const blPos = [];
  const bendNames = [];
  let acc = 0;
  for (let i = 0; i < elements.length - 1; i++) {
    acc += elements[i].L;
    blPos.push(acc);
    bendNames.push(elements[i].name);
  }
  const width = elements.reduce((s, e) => s + e.L, 0);

  return { elements, names, segNameMap, blPos, bendNames, width, useHem, side, Ls: [...Ls], As: [...As] };
}

export function renderProfileList(container) {
  const model = buildModel();
  if (!container) return;
  container.innerHTML = "";
  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr><th style="width:40px">#</th><th>Длина, мм</th><th>Угол ∠, °</th></tr></thead>
    <tbody></tbody>`;
  const tb = table.querySelector("tbody");

  for (let i = 0; i < model.Ls.length; i++) {
    const tr = document.createElement("tr");

    const tdIdx = document.createElement("td"); tdIdx.textContent = String(i + 1); tr.appendChild(tdIdx);

    const tdL = document.createElement("td");
    const inL = document.createElement("input");
    inL.type = "number"; inL.min = "0"; inL.step = "1"; inL.value = String(model.Ls[i]);
    inL.addEventListener("input", () => updateL(i, inL.value));
    const lLabel = document.createElement("div"); lLabel.className = "small"; lLabel.textContent = `L = ${model.segNameMap[i]}`;
    tdL.appendChild(inL); tdL.appendChild(lLabel);
    tr.appendChild(tdL);

    const tdA = document.createElement("td");
    if (i < model.Ls.length - 1) {
      const inA = document.createElement("input");
      inA.type = "number"; inA.step = "1"; inA.value = String(model.As[i] || 0);
      inA.addEventListener("input", () => updateA(i, inA.value));
      const aLabel = document.createElement("div"); aLabel.className = "small"; aLabel.textContent = `∠ = ${model.segNameMap[i]}`;
      tdA.appendChild(inA); tdA.appendChild(aLabel);
    } else tdA.innerHTML = `<span class="muted">—</span>`;
    tr.appendChild(tdA);

    tb.appendChild(tr);
  }
  container.appendChild(table);

  const countInfo = document.getElementById("countInfo");
  if (countInfo) countInfo.textContent = `Полок: ${model.Ls.length} | Линий гиба: ${Math.max(0, model.Ls.length - 1)}`;
}
