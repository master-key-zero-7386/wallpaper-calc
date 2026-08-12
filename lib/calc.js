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

export function computeRoom(room, wallpaperWidthMm, cfWidthMm) {
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

  let cfLenCm = 0;
  let cfStrips = 1;
  let cfNote = "";
  if (room.cfPattern && room.floors[0]) {
    const f = room.floors[0];
    const lMm = num(f.l);
    const wMm = num(f.w);
    const lenDimMm = room.cfDirection === "l" ? lMm : wMm;
    const widthDimMm = room.cfDirection === "l" ? wMm : lMm;
    cfStrips = cfWidthMm > 0 ? Math.max(1, Math.ceil(widthDimMm / cfWidthMm)) : 1;
    cfLenCm = (lenDimMm * cfStrips) / 10;
    if (room.floors.length > 1) {
      cfNote = "柄あり計算は床区画①のみで算出(複数区画は非対応)";
    }
  } else {
    cfLenCm = cfWidthMm > 0 ? (floorAreaM2 / (cfWidthMm / 1000)) * 100 : 0;
  }

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
  };
}

export const sanitizeKey = (name) => name.trim().replace(/[\s/\\'"]+/g, "_").slice(0, 120);
