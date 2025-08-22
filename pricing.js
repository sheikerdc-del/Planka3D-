import { $, round1 } from "./utils.js";

export function createPricing(getModelFn) {
  const getModel = typeof getModelFn === "function" ? getModelFn : (() => ({ width: 0 }));
  let PRICE_MULT = null;
  let PRICE_CAT_NAME = null;
  let colorAllOptions = [];
  let lastReport = null;

  function captureColorOptions() {
    const color = $("#color");
    if (!color) {
      console.warn('[pricing] Не найден элемент #color — пропускаю captureColorOptions');
      colorAllOptions = [];
      return false;
    }
    colorAllOptions = Array.from(color.querySelectorAll("option")).map(o => o.cloneNode(true));
    return true;
  }

  function filterColors() {
    const color = $("#color");
    const pok = $("#pokritie");
    if (!color || !pok) {
      console.warn('[pricing] Нет #color или #pokritie — пропускаю filterColors');
      return;
    }
    while (color.firstChild) color.removeChild(color.firstChild);

    if (!colorAllOptions.length) {
      const ok = captureColorOptions();
      if (!ok) return;
    }

    const first = colorAllOptions[0].cloneNode(true);
    color.appendChild(first);

    const pokVal = pok.value;
    if (pokVal === "0") return;

    colorAllOptions.forEach(opt => {
      const f = opt.getAttribute("data-filter");
      if (f && f === pokVal) color.appendChild(opt.cloneNode(true));
    });
  }

  function setWidthFromModel() {
    const m = getModel();
    const inSh = $("#shirina");
    if (inSh) inSh.value = String(round1(m.width));
  }

  function currentState() {
    const colorSel = $("#color");
    const opt = colorSel?.selectedOptions?.[0] || null;
    return {
      shirina: Number($("#shirina")?.value || 0),
      qty: Number($("#kolichestvo")?.value || 0),
      dlina: $("#dlina")?.value || "0",
      pokritie: $("#pokritie")?.value || "0",
      colorValue: colorSel?.value || "0",
      colorLabel: opt ? opt.textContent : "",
      mult: PRICE_MULT,
      cat: PRICE_CAT_NAME
    };
  }

  function recalcPrice() {
    const costEl = $("#cost");
    const infoEl = $("#supplyInfo");
    if (!costEl || !infoEl) return;

    const st = currentState();

    if (!st.shirina || !st.qty || st.dlina === "0" || st.pokritie === "0" || st.colorValue === "0" || !st.mult) {
      costEl.textContent = "заполните все поля и выберите категорию";
      infoEl.textContent = "";
      lastReport = null;
      return;
    }

    // FIX: корректная ширина листа по выбранной длине изделия
    const sheetWidth = st.dlina === "do1250" ? 1250 : 2000;

    const basePricePerSheet = Number(st.colorValue);
    const itemsPerSheet = Math.floor(sheetWidth / Math.max(1, Math.floor(st.shirina)));
    if (itemsPerSheet <= 0) {
      costEl.textContent = "ширина изделия превышает ширину листа";
      infoEl.textContent = "";
      lastReport = null;
      return;
    }

    const pricePerItemBase = basePricePerSheet / itemsPerSheet;
    const pricePerItem = Math.round(pricePerItemBase * st.mult);

    const fullSheets = Math.floor(st.qty / itemsPerSheet);
    const lastSheetItems = st.qty - fullSheets * itemsPerSheet;
    const lastSheetUsed = lastSheetItems * Math.floor(st.shirina);
    const leftoverOnLast = lastSheetItems === 0 ? 0 : (sheetWidth - lastSheetUsed);
    const leftoverWaste = leftoverOnLast;

    const sheetsForNonStd = lastSheetItems === 0 ? 0 : 1;
    const sheetsTotal = fullSheets + sheetsForNonStd;

    lastReport = {
      widthSigma: st.shirina,
      pricePerItem,
      category: st.cat,
      lengthKind: st.dlina === "do1250" ? "до 1250 мм" : "1250–2000 мм",
      coating: $("#pokritie")?.selectedOptions?.[0]?.textContent || "",
      colorLabel: st.colorLabel,
      qty: st.qty,
      sheetWidth,
      itemsPerSheet,
      fullSheets,
      lastSheetUsed,
      leftoverOnLast,
      leftoverWaste,
      stdPlanks: { names: [], qty: [] },
      stdPlanksSheets: 0,
      sheetsForNonStd,
      sheetsTotal
    };

    costEl.textContent = `${pricePerItem} ₽`;
    infoEl.textContent = `Лист: ${sheetWidth} мм • Σ=${round1(st.shirina)} мм • ${itemsPerSheet} шт/лист • Листов всего: ${sheetsTotal}`;
  }

  function bind() {
    captureColorOptions();
    $("#pokritie")?.addEventListener("change", () => { filterColors(); recalcPrice(); });
    $("#color")?.addEventListener("change", recalcPrice);
    $("#dlina")?.addEventListener("change", recalcPrice);
    $("#kolichestvo")?.addEventListener("input", recalcPrice);
    $("#priceCats")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-mult]");
      if (!btn) return;
      PRICE_MULT = Number(btn.getAttribute("data-mult"));
      PRICE_CAT_NAME = btn.getAttribute("data-name");
      recalcPrice();
    });

    if ($("#color")) filterColors();
  }

  function getReport() { return lastReport; }
  function refreshFromModel() { setWidthFromModel(); recalcPrice(); }

  bind();
  setWidthFromModel();
  recalcPrice();

  return { recalcPrice, refreshFromModel, getReport };
}
