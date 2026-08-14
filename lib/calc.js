let uid = 1;
export const nextId = () => uid++;

export const emptyOpening = () => ({ id: nextId(), h: "", w: "" });
export const emptyWall = () => ({ id: nextId(), h: "", w: "" });
export const emptyFloor = () => ({ id: nextId(), l: "", w: "" });

export function newRoom(name) {
  return {
    id: nextId(),
    name,
    floors: [emptyFloor()],
    ceilingEnabled: true,
    wallpaperEnabled: true,
    cfEnabled: true,
    useOtherSheet: false,
    workDone: false,
    cfPattern: true,
    cfDirection: "l",
    ns: { h: "", w: "" },
    ew: { h: "", w: "" },
    extraWalls: [],
    openings: {
      north: [emptyOpening()],
      south: [emptyOpening()],
      east: [emptyOpening()],
      west: [emptyOpening()],
    },
  };
}

export const num = (v) => (v === "" || v === null || isNaN(v) ? 0 : parseFloat(v));
export const mm2ToM2 = (l, w) => (num(l) * num(w)) / 1000000;
export const round1 = (n) => Math.round(n * 10) / 10;
export const roundUp = (n) => Math.ceil(n);

function computeSheetLen(room, widthMm, floorAreaM2) {
  let lenCm = 0;
  let strips = 1;
  let note = "";
  if (room.cfPattern && room.floors[0]) {
    const f = room.floors[0];
    const lMm = num(f.l);
    const wMm = num(f.w);
    const lenDimMm = room.cfDirection === "l" ? lMm : wMm;
    const widthDimMm = room.cfDirection === "l" ? wMm : lMm;
    strips = widthMm > 0 ? Math.max(1, Math.ceil(widthDimMm / widthMm)) : 1;
    lenCm = (lenDimMm * strips) / 10;
    if (room.floors.length > 1) {
      note = "柄あり計算は床区画①のみで算出(複数区画は非対応)";
    }
  } else {
    lenCm = widthMm > 0 ? (floorAreaM2 / (widthMm / 1000)) * 100 : 0;
  }
  return { lenCm, strips, note };
}

export function computeRoom(room, wallpaperWidthMm, cfWidthMm, otherSheetWidthMm) {
  const floorAreaM2 = room.floors.reduce((s, f) => s + mm2ToM2(f.l, f.w), 0);
  const ceilingAreaM2 = room.ceilingEnabled ? floorAreaM2 : 0;

  const northArea = mm2ToM2(room.ns.h, room.ns.w);
  const southArea = northArea;
  const eastArea = mm2ToM2(room.ew.h, room.ew.w);
  const westArea = eastArea;
  const extraArea = room.extraWalls.reduce((s, w) => s + mm2ToM2(w.h, w.w), 0);

  const openN = room.openings.north.reduce((s, o) => s + mm2ToM2(o.h, o.w), 0);
  const openS = room.openings.south.reduce((s, o) => s + mm2ToM2(o.h, o.w), 0);
  const openE = room.openings.east.reduce((s, o) => s + mm2ToM2(o.h, o.w), 0);
  const openW = room.openings.west.reduce((s, o) => s + mm2ToM2(o.h, o.w), 0);
  const openingArea = openN + openS + openE + openW;

  const netNorth = Math.max(0, northArea - openN);
  const netSouth = Math.max(0, southArea - openS);
  const netEast = Math.max(0, eastArea - openE);
  const netWest = Math.max(0, westArea - openW);

  const nsSubtotal = netNorth + netSouth;
  const ewSubtotal = netEast + netWest;

  const wallAreaM2 = Math.max(0, nsSubtotal + ewSubtotal + extraArea);
  const wallpaperAreaM2 = wallAreaM2 + ceilingAreaM2;

  const wallpaperLenCm = wallpaperWidthMm > 0 ? (wallpaperAreaM2 / (wallpaperWidthMm / 1000)) * 100 : 0;

  const cfCalc = computeSheetLen(room, cfWidthMm, floorAreaM2);
  const cfLenCm = cfCalc.lenCm;
  const cfStrips = cfCalc.strips;
  const cfNote = cfCalc.note;

  const otherSheetCalc = computeSheetLen(room, otherSheetWidthMm, floorAreaM2);
  const otherSheetLenCm = otherSheetCalc.lenCm;
  const otherSheetStrips = otherSheetCalc.strips;
  const otherSheetNote = otherSheetCalc.note;

  return {
    floorAreaM2,
    ceilingAreaM2,
    northArea,
    southArea,
    eastArea,
    westArea,
    openN,
    openS,
    openE,
    openW,
    netNorth,
    netSouth,
    netEast,
    netWest,
    nsSubtotal,
    ewSubtotal,
    extraArea,
    openingArea,
    wallAreaM2,
    wallpaperAreaM2,
    wallpaperLenCm,
    cfLenCm,
    cfStrips,
    cfNote,
    otherSheetLenCm,
    otherSheetStrips,
    otherSheetNote,
  };
}

export const sanitizeKey = (name) => name.trim().replace(/[\s/\\'"]+/g, "_").slice(0, 120);

export const UNIT_STEP_CM = { m: 100, "10cm": 10, cm: 1 };

// 仕入れ単位(m/10cm/cm)ごとに数量を切り上げてから単価をかける。
// 端数を継続的な小数量ではなく、実際に発注できる単位に丸める。
export function computeShopPurchase(shop, qtyM) {
  const stepCm = UNIT_STEP_CM[shop.unit] || UNIT_STEP_CM.m;
  const qtyCm = qtyM * 100;
  const units = qtyCm > 0 ? Math.ceil(qtyCm / stepCm - 1e-9) : 0;
  const purchasedQtyM = (units * stepCm) / 100;
  const price = num(shop.price);
  const subtotal = units * price;
  const normalizedPricePerM = price * (100 / stepCm);
  return { units, purchasedQtyM, subtotal, normalizedPricePerM };
}
