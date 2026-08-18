let uid = 1;
export const nextId = () => uid++;

// material: "opening"(通常の開口部) | "aluminum"(アルミ複合板) | "gypsum"(石膏ボード、上に壁紙を貼る前提)
//           | "paint"(ペンキ塗装、アルミ複合板と同様に壁紙は貼らない)
// done: アルミ複合板・石膏ボード・ペンキ塗装など、この開口部単体の施工が完了したか(個別完了)
export const emptyOpening = () => ({ id: nextId(), h: "", w: "", material: "opening", done: false });
export const emptyWall = () => ({ id: nextId(), h: "", w: "" });
export const emptyFloor = () => ({ id: nextId(), l: "", w: "" });

// 部屋(および区画)に共通の形状フィールド。
// floor.lが北(南)壁の幅、floor.wが東(西)壁の幅を兼ねる(直方体を想定)。
// 床の間・押入れ・クローゼットなど専用の壁を持つ隣接区画は、この形状ごとsubRoomsとして追加する。
function emptyRoomShape() {
  return {
    floor: emptyFloor(),
    ceilingEnabled: true,
    ceilingDone: false,
    wallpaperEnabled: true,
    wallpaperDone: false,
    cfEnabled: true,
    cfDone: false,
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
    memo: "",
  };
}

// 区画(床の間・押入れ・クローゼットなど、親部屋とつながった専用の壁を持つ隣接区画)。
// 高さは親部屋と共通のため持たない。ネストは1階層のみなのでsubRoomsは持たない。
export function newSubRoom(name) {
  return {
    id: nextId(),
    name,
    ...emptyRoomShape(),
  };
}

// 旧データ(床区画が配列形式floors[]だった頃)をfloor(単一)形式に変換する。
// 複数区画だった場合は先頭の区画のみを引き継ぐ(床のみの追加区画という概念自体を廃止したため)。
function migrateFloorsArray(s) {
  if (s.floor !== undefined) return s;
  const floorsArr = s.floors && s.floors.length ? s.floors : [emptyFloor()];
  const { floors, ...rest } = s;
  return { ...rest, floor: floorsArr[0] };
}

// 旧データ形式(床の縦横とは別にns/ewで壁の幅・高さを個別入力していた頃の保存データ)を
// 現行形式(床の幅を壁幅として共用+高さ1つ+区画)に変換する。
export function migrateRoom(rawR) {
  if (!rawR) return rawR;
  let r = migrateFloorsArray(rawR);
  if (r.height === undefined) {
    const legacyNs = r.ns || { h: "", w: "" };
    const legacyEw = r.ew || { h: "", w: "" };
    const floorEmpty = !num(r.floor.l) && !num(r.floor.w);
    const floor =
      floorEmpty && (num(legacyNs.w) || num(legacyEw.w))
        ? { ...r.floor, l: legacyNs.w, w: legacyEw.w }
        : r.floor;
    const { ns, ew, ...rest } = r;
    r = { ...rest, floor, height: legacyNs.h || legacyEw.h || "" };
  }
  return { ...r, subRooms: (r.subRooms || []).map(migrateFloorsArray) };
}

export const num = (v) => (v === "" || v === null || isNaN(v) ? 0 : parseFloat(v));
export const mm2ToM2 = (l, w) => (num(l) * num(w)) / 1000000;
export const round1 = (n) => Math.round(n * 10) / 10;
export const roundUp = (n) => Math.ceil(n);

function computeSheetLen(room, widthMm, floorAreaM2) {
  let lenCm = 0;
  let strips = 1;
  if (room.cfPattern) {
    const lMm = num(room.floor.l);
    const wMm = num(room.floor.w);
    const lenDimMm = room.cfDirection === "l" ? lMm : wMm;
    const widthDimMm = room.cfDirection === "l" ? wMm : lMm;
    strips = widthMm > 0 ? Math.max(1, Math.ceil(widthDimMm / widthMm)) : 1;
    lenCm = (lenDimMm * strips) / 10;
  } else {
    lenCm = widthMm > 0 ? (floorAreaM2 / (widthMm / 1000)) * 100 : 0;
  }
  return { lenCm, strips };
}

// 部屋(または追加部屋)1つぶんの面積・数量を計算する。高さは呼び出し側から渡す
// (追加部屋は親部屋の高さを共用するため、自身ではheightフィールドを持たない)。
function computeRoomLike(room, heightMm, wallpaperWidthMm, cfWidthMm, otherSheetWidthMm) {
  const floorAreaM2 = mm2ToM2(room.floor.l, room.floor.w);
  const ceilingAreaM2 = room.ceilingEnabled ? floorAreaM2 : 0;

  const northArea = mm2ToM2(heightMm, room.floor.l);
  const southArea = northArea;
  const eastArea = mm2ToM2(heightMm, room.floor.w);
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

  // 壁分と天井分を分けて出しておく(壁紙完了・天井完了は個別に管理できるため)
  const wallLenCm = wallpaperWidthMm > 0 ? (wallAreaM2 / (wallpaperWidthMm / 1000)) * 100 : 0;
  const ceilingLenCm = wallpaperWidthMm > 0 ? (ceilingAreaM2 / (wallpaperWidthMm / 1000)) * 100 : 0;
  const wallpaperLenCm = wallLenCm + ceilingLenCm;

  const cfCalc = computeSheetLen(room, cfWidthMm, floorAreaM2);
  const cfLenCm = cfCalc.lenCm;
  const cfStrips = cfCalc.strips;

  const otherSheetCalc = computeSheetLen(room, otherSheetWidthMm, floorAreaM2);
  const otherSheetLenCm = otherSheetCalc.lenCm;
  const otherSheetStrips = otherSheetCalc.strips;

  // 個別完了(wallpaperDone/cfDone/ceilingDone/開口部ごとのdone)を反映した残数量。
  // 部屋の一括「施工完了にする」はこれらのフラグへ一括反映される(呼び出し側でカスケードして書き込む)ため、
  // ここでは各項目の個別フラグだけを見ればよい。
  const wallpaperRemainingLenCm =
    (room.wallpaperEnabled && !room.wallpaperDone ? wallLenCm : 0) +
    (room.ceilingEnabled && !room.ceilingDone ? ceilingLenCm : 0);
  const cfRemainingLenCm = room.cfEnabled && !room.useOtherSheet && !room.cfDone ? cfLenCm : 0;
  const otherSheetRemainingLenCm = room.cfEnabled && room.useOtherSheet && !room.cfDone ? otherSheetLenCm : 0;
  const aluminumPanelAreaRemainingM2 = allOpenings.reduce(
    (s, o) => s + (o.material === "aluminum" && !o.done ? mm2ToM2(o.h, o.w) : 0),
    0
  );
  const gypsumBoardAreaRemainingM2 = allOpenings.reduce(
    (s, o) => s + (o.material === "gypsum" && !o.done ? mm2ToM2(o.h, o.w) : 0),
    0
  );
  const paintAreaM2 = allOpenings.reduce((s, o) => s + (o.material === "paint" ? mm2ToM2(o.h, o.w) : 0), 0);
  const paintAreaRemainingM2 = allOpenings.reduce(
    (s, o) => s + (o.material === "paint" && !o.done ? mm2ToM2(o.h, o.w) : 0),
    0
  );

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
    wallLenCm,
    ceilingLenCm,
    wallpaperLenCm,
    cfLenCm,
    cfStrips,
    otherSheetLenCm,
    otherSheetStrips,
    aluminumPanelAreaM2,
    gypsumBoardAreaM2,
    paintAreaM2,
    wallpaperRemainingLenCm,
    cfRemainingLenCm,
    otherSheetRemainingLenCm,
    aluminumPanelAreaRemainingM2,
    gypsumBoardAreaRemainingM2,
    paintAreaRemainingM2,
  };
}

// 部屋本体+区画(床の間・押入れ・クローゼットなど)を合算する。区画は親部屋の高さを使い、
// 壁紙/CFの発注数量への算入は区画自身のwallpaperEnabled/cfEnabledに従う
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
    combined.paintAreaM2 += sub.paintAreaM2;
    combined.wallpaperRemainingLenCm += sub.wallpaperRemainingLenCm;
    combined.cfRemainingLenCm += sub.cfRemainingLenCm;
    combined.otherSheetRemainingLenCm += sub.otherSheetRemainingLenCm;
    combined.aluminumPanelAreaRemainingM2 += sub.aluminumPanelAreaRemainingM2;
    combined.gypsumBoardAreaRemainingM2 += sub.gypsumBoardAreaRemainingM2;
    combined.paintAreaRemainingM2 += sub.paintAreaRemainingM2;
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

// ペンキ塗装は1缶で塗れる面積(㎡)を入力してもらい、必要面積÷それを切り上げて缶数を出す。
export function paintCansFromArea(areaM2, coverageM2PerCan) {
  const coverage = num(coverageM2PerCan);
  if (coverage <= 0) return 0;
  return areaM2 > 0 ? Math.ceil(areaM2 / coverage - 1e-9) : 0;
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
