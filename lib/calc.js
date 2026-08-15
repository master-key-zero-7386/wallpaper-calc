let uid = 1;
export const nextId = () => uid++;

// material: "opening"(通常の開口部) | "aluminum"(アルミ複合板) | "gypsum"(石膏ボード、上に壁紙を貼る前提)
export const emptyOpening = () => ({ id: nextId(), h: "", w: "", material: "opening" });
export const emptyWall = () => ({ id: nextId(), h: "", w: "" });
export const emptyFloor = () => ({ id: nextId(), l: "", w: "" });

// 部屋(および追加部屋)に共通の形状フィールド。
// floors[0]は主区画。lが北(南)壁の幅、wが東(西)壁の幅を兼ねる(直方体を想定)。
// floors[1]以降は増築部などの追加床面積のみで、壁幅とは連動しない。
function emptyRoomShape() {
  return {
    floors: [emptyFloor()],
    ceilingEnabled: true,
    wallpaperEnabled: true,
    cfEnabled: true,
    useOtherSheet: false,
    cfPattern: true,
    cfDirection: "l",
    extraWalls: [],
    openings: {
      north: [emptyOpening()],
      south: [emptyOpening()],
      east: [emptyOpening()],
      west: [emptyOpening()],
    },
  };
}

export function newRoom(name) {
  return {
    id: nextId(),
    name,
    ...emptyRoomShape(),
    height: "",
    workDone: false,
    subRooms: [],
  };
}

// 追加部屋(床の間など、親部屋とつながった凸部)。高さは親部屋と共通のため持たない。
// ネストは1階層のみなのでsubRoomsは持たない。
export function newSubRoom(name) {
  return {
    id: nextId(),
    name,
    ...emptyRoomShape(),
  };
}

// 旧データ形式(床の縦横とは別にns/ewで壁の幅・高さを個別入力していた頃の保存データ)を
// 現行形式(床区画①の幅を壁幅として共用+高さ1つ+追加部屋)に変換する。
export function migrateRoom(r) {
  if (!r) return r;
  if (r.height !== undefined) return { subRooms: [], ...r };
  const legacyNs = r.ns || { h: "", w: "" };
  const legacyEw = r.ew || { h: "", w: "" };
  const height = legacyNs.h || legacyEw.h || "";
  const floors = r.floors && r.floors.length ? r.floors : [emptyFloor()];
  const primary = floors[0];
  const primaryEmpty = !num(primary.l) && !num(primary.w);
  const migratedFloors =
    primaryEmpty && (num(legacyNs.w) || num(legacyEw.w))
      ? [{ ...primary, l: legacyNs.w, w: legacyEw.w }, ...floors.slice(1)]
      : floors;
  const { ns, ew, ...rest } = r;
  return { ...rest, floors: migratedFloors, height, subRooms: r.subRooms || [] };
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

// 部屋(または追加部屋)1つぶんの面積・数量を計算する。高さは呼び出し側から渡す
// (追加部屋は親部屋の高さを共用するため、自身ではheightフィールドを持たない)。
function computeRoomLike(room, heightMm, wallpaperWidthMm, cfWidthMm, otherSheetWidthMm) {
  const floorAreaM2 = room.floors.reduce((s, f) => s + mm2ToM2(f.l, f.w), 0);
  const ceilingAreaM2 = room.ceilingEnabled ? floorAreaM2 : 0;

  const primary = room.floors[0] || emptyFloor();
  const northArea = mm2ToM2(heightMm, primary.l);
  const southArea = northArea;
  const eastArea = mm2ToM2(heightMm, primary.w);
  const westArea = eastArea;
  const extraArea = room.extraWalls.reduce((s, w) => s + mm2ToM2(w.h, w.w), 0);

  // 石膏ボードは上に壁紙を貼るので、壁面積からは差し引かない(壁紙対象に含める)
  const openN = room.openings.north.reduce((s, o) => s + (o.material === "gypsum" ? 0 : mm2ToM2(o.h, o.w)), 0);
  const openS = room.openings.south.reduce((s, o) => s + (o.material === "gypsum" ? 0 : mm2ToM2(o.h, o.w)), 0);
  const openE = room.openings.east.reduce((s, o) => s + (o.material === "gypsum" ? 0 : mm2ToM2(o.h, o.w)), 0);
  const openW = room.openings.west.reduce((s, o) => s + (o.material === "gypsum" ? 0 : mm2ToM2(o.h, o.w)), 0);
  const openingArea = openN + openS + openE + openW;

  const allOpenings = [
    ...room.openings.north,
    ...room.openings.south,
    ...room.openings.east,
    ...room.openings.west,
  ];
  const aluminumPanelAreaM2 = allOpenings.reduce(
    (s, o) => s + (o.material === "aluminum" ? mm2ToM2(o.h, o.w) : 0),
    0
  );
  const gypsumBoardAreaM2 = allOpenings.reduce(
    (s, o) => s + (o.material === "gypsum" ? mm2ToM2(o.h, o.w) : 0),
    0
  );

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
    aluminumPanelAreaM2,
    gypsumBoardAreaM2,
  };
}

// 部屋本体+追加部屋(床の間など)を合算する。追加部屋は親部屋の高さを使い、
// 壁紙/CFの発注数量への算入は追加部屋自身のwallpaperEnabled/cfEnabledに従う
// (親のトグルは合算後の全体マスタースイッチとして呼び出し側で従来通り適用される)。
export function computeRoom(rawRoom, wallpaperWidthMm, cfWidthMm, otherSheetWidthMm) {
  const room = migrateRoom(rawRoom);
  const mainResult = computeRoomLike(room, room.height, wallpaperWidthMm, cfWidthMm, otherSheetWidthMm);
  const subRooms = room.subRooms || [];
  const subResults = subRooms.map((sr) =>
    computeRoomLike(sr, room.height, wallpaperWidthMm, cfWidthMm, otherSheetWidthMm)
  );

  const combined = { ...mainResult };
  subRooms.forEach((sr, i) => {
    const sub = subResults[i];
    combined.floorAreaM2 += sub.floorAreaM2;
    combined.ceilingAreaM2 += sub.ceilingAreaM2;
    combined.wallAreaM2 += sub.wallAreaM2;
    combined.openingArea += sub.openingArea;
    combined.extraArea += sub.extraArea;
    combined.aluminumPanelAreaM2 += sub.aluminumPanelAreaM2;
    combined.gypsumBoardAreaM2 += sub.gypsumBoardAreaM2;
    if (sr.wallpaperEnabled) {
      combined.wallpaperAreaM2 += sub.wallpaperAreaM2;
      combined.wallpaperLenCm += sub.wallpaperLenCm;
    }
    if (sr.cfEnabled) {
      combined.cfLenCm += sub.cfLenCm;
      combined.otherSheetLenCm += sub.otherSheetLenCm;
    }
  });

  return {
    ...combined,
    main: mainResult,
    subs: subRooms.map((sr, i) => ({ room: sr, result: subResults[i] })),
  };
}

export const sanitizeKey = (name) => name.trim().replace(/[\s/\\'"]+/g, "_").slice(0, 120);

// アルミ複合板・石膏ボードなど硬い板材は継続的な巻き物ではないため、ロス率は考慮せず
// 必要面積をパネル1枚の面積で割って切り上げるだけで枚数を出す。
export function panelSheetsFromArea(areaM2, panelWidthMm, panelHeightMm) {
  const panelAreaM2 = (num(panelWidthMm) / 1000) * (num(panelHeightMm) / 1000);
  if (panelAreaM2 <= 0) return 0;
  return areaM2 > 0 ? Math.ceil(areaM2 / panelAreaM2 - 1e-9) : 0;
}

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
