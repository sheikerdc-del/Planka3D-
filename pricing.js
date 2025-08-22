// pricing.js
import { $, round1, round3 } from "./utils.js";

export function createPricing(getModelFn) {
  let PRICE_MULT = null;
  let PRICE_CAT_NAME = null;
  let colorAllOptions = [];
  let lastReport = null;
  const getModel = typeof getModelFn === "function" ? getModelFn : (() => ({ width: 0 }));

  function filterColors() {
    const pokVal = $("#pokritie").value;
    const color = $("#color");
    while (color.firstChild) color.removeChild(color.firstChild);
    const first = colorAllOptions[0].cloneNode(true);
    color.appendChild(first);
    if (pokVal === "0") return;
    colorAllOptions.forEach(opt => {
      const f = opt.getAttribute("data-filter");
      if (f && f === pokVal) color.appendChild(opt.cloneNode(true));
    });
  }

  function currentState() {
    const colorSel = $("#color");
    const opt = colorSel.selectedOptions[0] || null;
    return {
      shirina: Number($("#shirina").value || 0),
      qty: Number($("#kolichestvo").value || 0),
      dlina: $("#dlina").value,
      pokritie: $("#pokritie").value,
      colorValue: colorSel.value,
      colorLabel: opt ? opt.textContent : "",
      colorData: {
        cvet: opt ? (opt.getAttribute("data-cvet") || "") : "",
        dlina_data: opt ? (opt.getAttribute("data-dlina") || "") : "",
        plankaname_data: opt ? (opt.getAttribute("data-plankaname") || "") : ""
      },
      mult: PRICE_MULT,
      cat: PRICE_CAT_NAME
    };
  }

  function recalcPrice() {
    const costEl = $("#cost");
    const infoEl = $("#supplyInfo");

    const st = currentState();
    if (!st.shirina || !st.qty || st.dlina === "0" || st.pokritie === "0" || st.colorValue === "0" || !st.mult) {
      costEl.textContent = "заполните все поля и выберите категорию";
      infoEl.textContent = "";
      lastReport = null;
      return;
    }

    const shirina_lista = (st.dlina === "do1250") ? 2000 : 1250;
    const cena_lista = Number(st.colorValue);
    const cvet = st.colorData.cvet;
    const dlina_data = st.colorData.dlina_data;
    const plankaname_data = st.colorData.plankaname_data;

    const shirina10 = Math.floor(st.shirina);
    const kolichestvo_v_zakaze = st.qty;

    const izd_iz_lista = Math.floor(shirina_lista / Math.max(1, shirina10));
    if (izd_iz_lista <= 0) {
      costEl.textContent = "ширина изделия превышает ширину листа";
      infoEl.textContent = "";
      lastReport = null;
      return;
    }

    const celih_listov = Math.floor(kolichestvo_v_zakaze / izd_iz_lista);
    const izd_iz_posl_lista = kolichestvo_v_zakaze - (izd_iz_lista * celih_listov);

    let posl_na_planki = 0;
    if (celih_listov >= 1) posl_na_planki = izd_iz_posl_lista * shirina10;
    else posl_na_planki = shirina10 * kolichestvo_v_zakaze;

    let ostatok_posl_lista = 0, musor = 0, min_ostatok = 0, na_stand_planki = 0;
    let stdPlanks = { names: [], qty: [] };

    if ((izd_iz_posl_lista === 0) && (celih_listov > 1)) {
      ostatok_posl_lista = 0; musor = 0; min_ostatok = 0;
    } else {
      ostatok_posl_lista = shirina_lista - posl_na_planki;
      musor = ostatok_posl_lista;
      min_ostatok = musor;

      if (!((shirina_lista === 2000) || (ostatok_posl_lista < 190) || (cvet === "любой") || (cvet === "другой"))) {
        if (shirina_lista === 1250) {
          const st_cveta = [9003, 9005, 3009, 7024, 5005, 6005, 8017, 3005, 3011, "RR11", "RR32", "RR29", "RR23", "RR33"];

          if (kolichestvo_v_zakaze / izd_iz_lista <= 1) {
            ostatok_posl_lista = shirina_lista - kolichestvo_v_zakaze * shirina10;
            posl_na_planki = kolichestvo_v_zakaze * shirina10;
          }

          const inList = st_cveta.indexOf(isNaN(Number(cvet)) ? cvet : Number(cvet)) !== -1;
          if (inList) {
            const ostatok = ostatok_posl_lista;
            const dlina_array = dlina_data ? dlina_data.split(',').map(Number) : [];
            const plankaname_array = plankaname_data ? plankaname_data.split(',') : [];
            stdPlanks.names = plankaname_array.slice();

            const pick2 = () => {
              const i = Math.floor(ostatok / dlina_array[0]);
              const j = Math.floor(ostatок / dlina_array[1]);
              let kol1 = 0, kol2 = 0;
              if ((ostatok - dlina_array[0] * i) <= (ostatок - dlina_array[1] * j)) { kol1 = i; kol2 = 0; }
              else { kol1 = 0; kol2 = j; }
              return { kol1, kol2, min_ostatok: ostatок - kol1 * dlina_array[0] - kol2 * dlina_array[1] };
            };
            const pick3 = () => {
              const i = Math.floor(ostatok / dlina_array[0]);
              const j = Math.floor(ostatок / dlina_array[1]);
              const k = Math.floor(ostatок / dlina_array[2]);
              const ost1 = ostatок - dlina_array[0] * i;
              const ost2 = ostatок - dlina_array[1] * j;
              const ost3 = ostatок - dlina_array[2] * k;
              if (ost1 <= ost2 && ost1 <= ost3) return { kol1: i, kol2: 0, kol3: 0, min_ostatок: ost1 };
              if (ост2 <= ост1 && ост2 <= ост3) return { kol1: 0, kol2: j, kol3: 0, min_остаток: ост2 };
              return { kol1: 0, kol2: 0, kol3: k, min_остаток: ост3 };
            };
            const pick4 = () => {
              const i = Math.floor(ostatок / dlina_array[0]);
              const j = Math.floor(ostatок / dlina_array[1]);
              const k = Math.floor(ostatок / dlina_array[2]);
              const l = Math.floor(ostatок / dlina_array[3]);
              const ost1 = ostatок - dlina_array[0] * i;
              const ost2 = ostatок - dlina_array[1] * j;
              const ost3 = ostatок - dlina_array[2] * k;
              const ost4 = ostatок - dlina_array[3] * l;
              const arr = [ost1, ost2, ost3, ost4];
              const minIdx = arr.indexOf(Math.min(...arr));
              return {
                kol1: minIdx === 0 ? i : 0,
                kol2: minIdx === 1 ? j : 0,
                kol3: minIdx === 2 ? k : 0,
                kol4: minIdx === 3 ? l : 0,
                min_ostatok: arr[minIdx]
              };
            };

            if (dlina_array.length === 2) {
              const r = pick2(); min_ostatок = r.min_ostatok;
              na_stand_planki = (ostatok_posl_lista - min_ostatок) / 1250; stdPlanks.qty = [r.kol1, r.kol2];
            }
            if (dlina_array.length === 3) {
              const r = pick3(); min_ostatок = r.min_ostatок;
              na_stand_planki = (ostatok_posl_lista - min_ostatок) / 1250; stdPlanks.qty = [r.kol1, r.kol2, r.kol3];
            }
            if (dlina_array.length === 4) {
              const r = pick4(); min_ostatок = r.min_ostatок;
              na_stand_planki = (ostatок_posл_lista - min_ostatок) / 1250; stdPlanks.qty = [r.kol1, r.kol2, r.kol3, r.kol4];
            }
          }
        }
      }
    }

    musor = min_ostatок;

    let listov_dlya_sebest = 0;
    if (kolichestvo_v_zakaze / izd_iz_lista > 1) {
      listov_dlya_sebest = celih_listov + posl_na_planki / shirina_lista + musor / shirina_lista;
    } else {
      listov_dlya_sebest = posl_na_planki / shirina_lista + musor / shirina_lista;
    }

    const cena_listov = listov_dlya_sebest * cena_lista;
    const cena_rabota = kolichestvo_v_zakaze * 0.56;
    const sebestoimost = (cena_listov + cena_rabота) / Math.max(1, kolichestvo_v_zakaze);
    const listov_total = listov_dlya_sebest + na_stand_planki;
    const price = Math.ceil(sebestoimost * st.mult);

    $("#cost").innerHTML = `<b style="color:#fff">${price} руб.</b> <span class="small muted">(кат. ${st.cat})</span>`;
    $("#supplyInfo").innerHTML =
      `Листы на нестанд.: ${round3(listov_dlya_sebest)} шт.` +
      (stdPlanks.qty?.length ? `<br>Станд. планки из остатка: ${round3(na_stand_planki)} лист.` : "") +
      (stdPlanks.qty?.length ? stdPlanks.qty.map((q, i) => `<br>${stdPlanks.names[i] || "Планка " + (i + 1)}: ${q} шт.`).join("") : "") +
      `<br>Мусор (неиспользуемый остаток): ${round1(musor)} мм` +
      `<br>Всего листов: ${round3(listov_total)} шт.`;

    lastReport = {
      pricePerItem: price,
      category: st.cat,
      lengthKind: st.dlina === "do1250" ? "до 1250 мм" : (st.dlina === "bolee1250" ? "1250–2000 мм" : "—"),
      coating: st.pokritie,
      colorLabel: st.colorLabel,
      qty: st.qty,
      sheetWidth: shirina_lista,
      widthSigma: st.shirina,
      itemsPerSheet: izd_iz_lista,
      fullSheets: celih_listov,
      lastSheetUsed: posl_na_planki,
      leftoverOnLast: ostatok_posl_lista,
      leftoverWaste: musor,
      stdPlanksSheets: na_stand_planki,
      stdPlanks,
      sheetsForNonStd: listov_dlya_sebest,
      sheetsTotal: listov_total
    };
  }

  function setup() {
    const pokritie = $("#pokritie");
    const color = $("#color");
    const dlina = $("#dlina");
    const qty = $("#kolichestvo");
    const cats = $("#priceCats");
    colorAllOptions = Array.from(color.querySelectorAll("option")).map(o => o.cloneNode(true));

    pokritie.addEventListener("change", () => { filterColors(); $("#color").value = "0"; recalcPrice(); });
    color.addEventListener("change", recalcPrice);
    dlina.addEventListener("change", recalcPrice);
    qty.addEventListener("input", recalcPrice);

    cats.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        cats.querySelectorAll("button").forEach(b => b.classList.remove("primary"));
        btn.classList.add("primary");
        PRICE_MULT = Number(btn.dataset.mult);
        PRICE_CAT_NAME = btn.dataset.name;
        recalcPrice();
      });
    });

    filterColors();
  }

  function syncFromModel(model) {
    const width = model?.width ?? getModel()?.width ?? 0;
    const el = document.getElementById("shirina");
    if (el) el.value = round1(width);
    recalcPrice();
  }

  setup();
  const existingModel = getModel();
  if (existingModel && typeof existingModel.width !== "undefined") syncFromModel(existingModel);

  return {
    syncFromModel,
    getReport: () => lastReport
  };
}
