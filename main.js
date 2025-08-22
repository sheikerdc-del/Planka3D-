// main.js
import { $, round1 } from "./utils.js";
import { buildModel, getLA, setLA, addFlange, removeFlange, renderProfileList, pointsFromLA, onChange } from "./model.js";
import { drawCross, drawFlat, renderWidthInfo, buildLayoutTable, exportFlatSVG, exportProfileSVG, exportProductionSVG } from "./svgRender.js";
import { initPointsEditor, applyPointsToProfile, importProfileToPoints, clearPoints } from "./pointsEditor.js";
import { createPricing } from "./pricing.js";
import { initViewer, updateProfile3D } from "./viewer3d.js";

let pricingCtrl = null;

function recalcAll() {
  const model = buildModel();

  // 2D
  drawCross(model, $("#cross"));
  drawFlat(model, $("#flat"));
  renderWidthInfo(model, $("#widthInfo"));
  buildLayoutTable(model, $("#layoutTable"));

  // UI список полок/углов
  renderProfileList($("#profileList"));

  // ширина → калькулятор цены
  pricingCtrl?.syncFromModel(model);

  // 3D
  const pts = pointsFromLA(model.Ls, model.As, { x: 0, y: 0 })
    .map(p => ({ x: p.x, y: p.y })); // уже в мм; используется как форма
  updateProfile3D(pts);
}

function bindUI() {
  $("#recalc").addEventListener("click", recalcAll);
  $("#addFlange").addEventListener("click", () => { addFlange(); });
  $("#removeFlange").addEventListener("click", () => { removeFlange(); });

  $("#useHem").addEventListener("change", recalcAll);
  $("#hemSide").addEventListener("change", recalcAll);

  // Экспорт
  $("#exportCross").addEventListener("click", exportProfileSVG);
  $("#exportFlat").addEventListener("click", exportFlatSVG);
  $("#exportProd").addEventListener("click", () => {
    const report = pricingCtrl?.getReport();
    exportProductionSVG(buildModel(), report);
  });

  // Редактор по точкам
  $("#applyFromPoints").addEventListener("click", () => { applyPointsToProfile(); });
  $("#importToPoints").addEventListener("click", () => { importProfileToPoints(); });
  $("#clearPoints").addEventListener("click", () => { clearPoints(); });
}

function init3D() {
  initViewer($("#viewer3d"));
}

function initPrice() {
  pricingCtrl = createPricing(() => buildModel());
}

function initPoints() {
  initPointsEditor();
}

function initialSync() {
  const model = buildModel();
  $("#shirina").value = round1(model.width);
}

function main() {
  bindUI();
  init3D();
  initPoints();
  initPrice();

  onChange(() => recalcAll());
  initialSync();
  recalcAll();
}

document.addEventListener("DOMContentLoaded", main);
