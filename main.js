import { $, round1 } from "./utils.js";
import { buildModel, onChange, renderProfileList, addFlange, removeFlange, pointsFromLA } from "./model.js";
import { drawCross, drawFlat, renderWidthInfo, buildLayoutTable, exportProfileSVG, exportFlatSVG, exportProductionSVG } from "./svgRender.js";
import { initViewer, updateProfile3D } from "./viewer3d.js";
import { initPointsEditor, applyPointsToProfile, importProfileToPoints, clearPoints } from "./pointsEditor.js";
import { createPricing } from "./pricing.js";

let pricingCtrl = null;

function bindUI() {
  const on = (id, evt, handler) => {
    const el = $(id);
    if (!el) { console.warn(`[UI] Не найден #${id}`); return; }
    el.addEventListener(evt, handler);
  };

  on("recalc", "click", recalcAll);
  on("addFlange", "click", () => { addFlange(); });
  on("removeFlange", "click", () => { removeFlange(); });

  on("useHem", "change", recalcAll);
  on("hemSide", "change", recalcAll);

  on("exportCross", "click", exportProfileSVG);
  on("exportFlat", "click", exportFlatSVG);
  on("exportProd", "click", () => {
    const report = pricingCtrl?.getReport();
    exportProductionSVG(buildModel(), report);
  });

  on("applyFromPoints", "click", () => { applyPointsToProfile(); });
  on("importToPoints", "click", () => { importProfileToPoints(); });
  on("clearPoints", "click", () => { clearPoints(); });
}

function recalcAll() {
  const model = buildModel();

  renderProfileList($("#profileList"));
  drawCross(model, $("#cross"));
  drawFlat(model, $("#flat"));
  renderWidthInfo(model, $("#widthInfo"));
  buildLayoutTable(model, $("#layoutTable"));

  pricingCtrl?.refreshFromModel();

  const pts = pointsFromLA(model.Ls, model.As, { x: 0, y: 0 });
  updateProfile3D(pts.map(p => ({ x: p.x, y: p.y })));
}

function init() {
  try {
    console.info("[app] init start");
    bindUI();

    initPointsEditor($("#pointCanvas"), $("#pointsTable"));
    initViewer($("#viewer3d"));

    pricingCtrl = createPricing(() => buildModel());

    recalcAll();
    onChange(() => recalcAll());

    console.info("[app] init done");
    window.appReady = true;
  } catch (e) {
    console.error("[app] init error", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
