"use client";

import { useState, useEffect } from "react";
import {
  newRoom,
  emptyOpening,
  emptyWall,
  emptyFloor,
  num,
  round1,
  roundUp,
  computeRoom,
} from "../lib/calc";

let localUid = 1;
const nextIdSafe = () => `local-${localUid++}`;

function NumInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 12px",
        fontSize: 16,
        border: "1px solid #cbd5c0",
        borderRadius: 6,
        background: "#fff",
      }}
    />
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#5a6b52", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function SectionTitle({ children, accent }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: accent || "#33502e",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 10,
        borderBottom: "2px solid #d8e3cd",
        paddingBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function OpeningRow({ opening, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
      <input
        type="number"
        inputMode="decimal"
        placeholder="高さmm"
        value={opening.h}
        onChange={(e) => onChange({ ...opening, h: e.target.value })}
        style={{ flex: "1 1 0%", minWidth: 0, padding: "7px 8px", fontSize: 14, border: "1px solid #cbd5c0", borderRadius: 5 }}
      />
      <span style={{ color: "#8a9a80" }}>×</span>
      <input
        type="number"
        inputMode="decimal"
        placeholder="幅mm"
        value={opening.w}
        onChange={(e) => onChange({ ...opening, w: e.target.value })}
        style={{ flex: "1 1 0%", minWidth: 0, padding: "7px 8px", fontSize: 14, border: "1px solid #cbd5c0", borderRadius: 5 }}
      />
      <button
        onClick={onRemove}
        style={{
          width: 30,
          height: 30,
          borderRadius: 5,
          border: "1px solid #d99",
          background: "#fdeeee",
          color: "#a33",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}

function DirectionOpenings({ label, list, onChange }) {
  return (
    <div style={{ marginTop: 12, marginBottom: 4, paddingLeft: 10, borderLeft: "4px solid #7a9a68" }}>
      <div
        style={{
          display: "inline-block",
          fontSize: 13,
          fontWeight: 800,
          color: "#243d20",
          background: "#dfeacf",
          padding: "3px 10px",
          borderRadius: 5,
          marginBottom: 6,
        }}
      >
        {label}の開口部(窓・入口など)
      </div>
      {list.length === 0 && (
        <div style={{ fontSize: 12, color: "#9aa892", marginBottom: 4 }}>開口部なし</div>
      )}
      {list.map((o, i) => (
        <OpeningRow
          key={o.id}
          opening={o}
          onChange={(v) => {
            const copy = [...list];
            copy[i] = v;
            onChange(copy);
          }}
          onRemove={() => onChange(list.filter((_, idx) => idx !== i))}
        />
      ))}
      <button
        onClick={() => onChange([...list, emptyOpening()])}
        style={{
          fontSize: 13,
          padding: "5px 10px",
          borderRadius: 5,
          border: "1px dashed #9ab08c",
          background: "#f3f8ee",
          color: "#4c6b40",
          cursor: "pointer",
        }}
      >
        + {label}に開口部を追加
      </button>
    </div>
  );
}

function RoomCard({ room, updateRoom, removeRoom, result }) {
  const [open, setOpen] = useState(true);

  const setField = (patch) => updateRoom({ ...room, ...patch });

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d8e3cd",
        borderRadius: 10,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 14px",
          background: "#eef4e6",
          cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <input
          value={room.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setField({ name: e.target.value })}
          style={{
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            background: "transparent",
            color: "#33502e",
            width: "60%",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#5a6b52" }}>
            壁{round1(result.wallpaperAreaM2)}㎡/{round1(result.wallpaperLenCm)}cm{room.wallpaperExcluded ? "(除外)" : ""}・床{round1(result.floorAreaM2)}㎡/{round1(result.cfLenCm)}cm{room.cfExcluded ? "(除外)" : ""}
          </span>
          <span style={{ fontSize: 18, color: "#5a6b52" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: 14 }}>
          <SectionTitle>床 (クッションフロア用)</SectionTitle>
          {room.floors.map((f, i) => (
            <div key={f.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <input
                type="number"
                inputMode="decimal"
                placeholder="縦mm"
                value={f.l}
                onChange={(e) => {
                  const copy = [...room.floors];
                  copy[i] = { ...f, l: e.target.value };
                  setField({ floors: copy });
                }}
                style={{ flex: "1 1 0%", minWidth: 0, padding: "8px 10px", fontSize: 15, border: "1px solid #cbd5c0", borderRadius: 5 }}
              />
              <span style={{ color: "#8a9a80" }}>×</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="横mm"
                value={f.w}
                onChange={(e) => {
                  const copy = [...room.floors];
                  copy[i] = { ...f, w: e.target.value };
                  setField({ floors: copy });
                }}
                style={{ flex: "1 1 0%", minWidth: 0, padding: "8px 10px", fontSize: 15, border: "1px solid #cbd5c0", borderRadius: 5 }}
              />
              {room.floors.length > 1 && (
                <button
                  onClick={() => setField({ floors: room.floors.filter((_, idx) => idx !== i) })}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 5,
                    border: "1px solid #d99",
                    background: "#fdeeee",
                    color: "#a33",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setField({ floors: [...room.floors, emptyFloor()] })}
            style={{
              fontSize: 13,
              padding: "5px 10px",
              borderRadius: 5,
              border: "1px dashed #9ab08c",
              background: "#f3f8ee",
              color: "#4c6b40",
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            + 床区画を追加
          </button>

          <div style={{ margin: "4px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id={`cfex-${room.id}`}
              checked={room.cfExcluded}
              onChange={(e) => setField({ cfExcluded: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor={`cfex-${room.id}`} style={{ fontSize: 14, color: "#33502e" }}>
              この部屋の床は寸法メモのみ(CF発注数量に含めない)
            </label>
          </div>

          <div
            style={{
              margin: "6px 0 14px",
              padding: 10,
              background: "#fdf6e6",
              border: "1px solid #ecd9a0",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#7a5a10", marginBottom: 6 }}>CFの柄タイプ</div>
            <div style={{ display: "flex", gap: 8, marginBottom: room.cfPattern ? 8 : 0 }}>
              <button
                onClick={() => setField({ cfPattern: false })}
                style={{
                  flex: "1 1 0%",
                  minWidth: 0,
                  padding: "7px",
                  borderRadius: 6,
                  border: !room.cfPattern ? "2px solid #4c6b40" : "1px solid #cbd5c0",
                  background: !room.cfPattern ? "#e6f0dd" : "#fff",
                  color: "#33502e",
                  fontSize: 13,
                  fontWeight: !room.cfPattern ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                無地(向き自由)
              </button>
              <button
                onClick={() => setField({ cfPattern: true })}
                style={{
                  flex: "1 1 0%",
                  minWidth: 0,
                  padding: "7px",
                  borderRadius: 6,
                  border: room.cfPattern ? "2px solid #b8860b" : "1px solid #cbd5c0",
                  background: room.cfPattern ? "#f5e6b8" : "#fff",
                  color: "#7a5a10",
                  fontSize: 13,
                  fontWeight: room.cfPattern ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                木目調・柄あり(向き固定)
              </button>
            </div>
            {room.cfPattern && (
              <div>
                <div style={{ fontSize: 12, color: "#7a5a10", marginBottom: 4 }}>柄の流れる方向(床区画①の寸法を使用)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setField({ cfDirection: "l" })}
                    style={{
                      flex: "1 1 0%",
                      minWidth: 0,
                      padding: "6px",
                      borderRadius: 6,
                      border: room.cfDirection === "l" ? "2px solid #b8860b" : "1px solid #cbd5c0",
                      background: room.cfDirection === "l" ? "#f5e6b8" : "#fff",
                      fontSize: 12,
                      color: "#7a5a10",
                      cursor: "pointer",
                    }}
                  >
                    縦(長)方向に柄が流れる
                  </button>
                  <button
                    onClick={() => setField({ cfDirection: "w" })}
                    style={{
                      flex: "1 1 0%",
                      minWidth: 0,
                      padding: "6px",
                      borderRadius: 6,
                      border: room.cfDirection === "w" ? "2px solid #b8860b" : "1px solid #cbd5c0",
                      background: room.cfDirection === "w" ? "#f5e6b8" : "#fff",
                      fontSize: 12,
                      color: "#7a5a10",
                      cursor: "pointer",
                    }}
                  >
                    横(短)方向に柄が流れる
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ margin: "10px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id={`ceil-${room.id}`}
              checked={room.ceilingEnabled}
              onChange={(e) => setField({ ceilingEnabled: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor={`ceil-${room.id}`} style={{ fontSize: 14, color: "#33502e" }}>
              天井にも壁紙を貼る(床と同面積で計算)
            </label>
          </div>

          <div style={{ margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id={`wpex-${room.id}`}
              checked={room.wallpaperExcluded}
              onChange={(e) => setField({ wallpaperExcluded: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor={`wpex-${room.id}`} style={{ fontSize: 14, color: "#33502e" }}>
              この部屋の壁・天井は寸法メモのみ(壁紙発注数量に含めない)
            </label>
          </div>

          <SectionTitle>壁 (北・南)</SectionTitle>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="高さ mm">
              <NumInput value={room.ns.h} onChange={(v) => setField({ ns: { ...room.ns, h: v } })} placeholder="2400" />
            </Field>
            <Field label="幅(北側) mm">
              <NumInput value={room.ns.w} onChange={(v) => setField({ ns: { ...room.ns, w: v } })} placeholder="3500" />
            </Field>
          </div>
          <DirectionOpenings
            label="北"
            list={room.openings.north}
            onChange={(v) => setField({ openings: { ...room.openings, north: v } })}
          />
          <DirectionOpenings
            label="南"
            list={room.openings.south}
            onChange={(v) => setField({ openings: { ...room.openings, south: v } })}
          />

          <div style={{ height: 1, background: "#d8e3cd", margin: "16px 0" }} />
          <SectionTitle>壁 (東・西)</SectionTitle>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="高さ mm">
              <NumInput value={room.ew.h} onChange={(v) => setField({ ew: { ...room.ew, h: v } })} placeholder="2400" />
            </Field>
            <Field label="幅(東側) mm">
              <NumInput value={room.ew.w} onChange={(v) => setField({ ew: { ...room.ew, w: v } })} placeholder="2600" />
            </Field>
          </div>
          <DirectionOpenings
            label="東"
            list={room.openings.east}
            onChange={(v) => setField({ openings: { ...room.openings, east: v } })}
          />
          <DirectionOpenings
            label="西"
            list={room.openings.west}
            onChange={(v) => setField({ openings: { ...room.openings, west: v } })}
          />

          <div style={{ height: 14 }} />
          <SectionTitle>追加の壁 (増築部・間仕切りなど)</SectionTitle>
          {room.extraWalls.map((w, i) => (
            <div key={w.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <input
                type="number"
                inputMode="decimal"
                placeholder="高さmm"
                value={w.h}
                onChange={(e) => {
                  const copy = [...room.extraWalls];
                  copy[i] = { ...w, h: e.target.value };
                  setField({ extraWalls: copy });
                }}
                style={{ flex: "1 1 0%", minWidth: 0, padding: "8px 10px", fontSize: 15, border: "1px solid #cbd5c0", borderRadius: 5 }}
              />
              <span style={{ color: "#8a9a80" }}>×</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="幅mm"
                value={w.w}
                onChange={(e) => {
                  const copy = [...room.extraWalls];
                  copy[i] = { ...w, w: e.target.value };
                  setField({ extraWalls: copy });
                }}
                style={{ flex: "1 1 0%", minWidth: 0, padding: "8px 10px", fontSize: 15, border: "1px solid #cbd5c0", borderRadius: 5 }}
              />
              <button
                onClick={() => setField({ extraWalls: room.extraWalls.filter((_, idx) => idx !== i) })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 5,
                  border: "1px solid #d99",
                  background: "#fdeeee",
                  color: "#a33",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setField({ extraWalls: [...room.extraWalls, emptyWall()] })}
            style={{
              fontSize: 13,
              padding: "5px 10px",
              borderRadius: 5,
              border: "1px dashed #9ab08c",
              background: "#f3f8ee",
              color: "#4c6b40",
              cursor: "pointer",
            }}
          >
            + 壁を追加
          </button>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "#f3f8ee",
              borderRadius: 8,
              fontSize: 13,
              color: "#33502e",
              lineHeight: 1.9,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4, color: "#4c6b40" }}>床・天井</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>床面積(区画合計)</span>
              <span>{round1(result.floorAreaM2)} ㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>天井面積</span>
              <span>{room.ceilingEnabled ? round1(result.ceilingAreaM2) + " ㎡" : "対象外(0㎡)"}</span>
            </div>

            <div style={{ fontWeight: 700, margin: "10px 0 4px", color: "#4c6b40" }}>壁(方角別、開口部差引前 → 差引後)</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>北</span>
              <span>{round1(result.northArea)}㎡ − 開口{round1(result.openN)}㎡ = {round1(result.netNorth)}㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>南</span>
              <span>{round1(result.southArea)}㎡ − 開口{round1(result.openS)}㎡ = {round1(result.netSouth)}㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>東</span>
              <span>{round1(result.eastArea)}㎡ − 開口{round1(result.openE)}㎡ = {round1(result.netEast)}㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>西</span>
              <span>{round1(result.westArea)}㎡ − 開口{round1(result.openW)}㎡ = {round1(result.netWest)}㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>追加壁</span>
              <span>{round1(result.extraArea)}㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 4, borderTop: "1px dashed #b9c9ab", paddingTop: 4 }}>
              <span>北南計</span>
              <span>{round1(result.nsSubtotal)}㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>東西計</span>
              <span>{round1(result.ewSubtotal)}㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>壁合計(天井含まず)</span>
              <span>{round1(result.wallAreaM2)}㎡</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#243d20" }}>
              <span>壁紙対象合計(壁+天井)</span>
              <span>{round1(result.wallpaperAreaM2)}㎡</span>
            </div>

            <div style={{ borderTop: "1px solid #b9c9ab", marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>壁紙必要長さ(実数量)</span>
                <span>{round1(result.wallpaperLenCm)} cm</span>
              </div>
              {room.wallpaperExcluded && (
                <div style={{ fontSize: 11, color: "#a33", marginTop: 2 }}>寸法メモのみ:発注数量の合計には加算されません</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: room.wallpaperExcluded ? 8 : 0 }}>
                <span>CF必要長さ(実数量)</span>
                <span>{round1(result.cfLenCm)} cm{room.cfPattern ? `(${result.cfStrips}枚継ぎ)` : ""}</span>
              </div>
              {room.cfExcluded && (
                <div style={{ fontSize: 11, color: "#a33", marginTop: 2 }}>寸法メモのみ:発注数量の合計には加算されません</div>
              )}
              {room.cfPattern && (
                <div style={{ fontSize: 11, color: "#b8860b", marginTop: 2 }}>
                  柄あり計算:幅方向がロール幅を超えるため{result.cfStrips}枚を継いで施工する前提の長さ
                </div>
              )}
              {result.cfNote && <div style={{ fontSize: 11, color: "#a33", marginTop: 2 }}>{result.cfNote}</div>}
            </div>
          </div>

          <button
            onClick={removeRoom}
            style={{
              marginTop: 10,
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 5,
              border: "1px solid #d99",
              background: "#fdeeee",
              color: "#a33",
              cursor: "pointer",
            }}
          >
            この部屋を削除
          </button>
        </div>
      )}
    </div>
  );
}

export default function WallpaperCalcApp() {
  const [rooms, setRooms] = useState([newRoom("部屋1")]);
  const [wallpaperWidth, setWallpaperWidth] = useState("910");
  const [cfWidth, setCfWidth] = useState("1820");
  const [wallpaperLossRate, setWallpaperLossRate] = useState("8");
  const [cfLossRate, setCfLossRate] = useState("3");
  const [lossMode, setLossMode] = useState("perRoom");

  const [projectName, setProjectName] = useState("");
  const [savedProjects, setSavedProjects] = useState([]);
  const [projectStatus, setProjectStatus] = useState("");
  const [showProjectList, setShowProjectList] = useState(false);

  const refreshProjectList = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("list failed");
      const list = await res.json();
      setSavedProjects(list);
    } catch (e) {
      setSavedProjects([]);
    }
  };

  useEffect(() => {
    refreshProjectList();
  }, []);

  const saveProject = async () => {
    if (!projectName.trim()) {
      setProjectStatus("物件名を入力してや");
      return;
    }
    setProjectStatus("保存中...");
    try {
      const payload = {
        rooms,
        wallpaperWidth,
        cfWidth,
        wallpaperLossRate,
        cfLossRate,
        lossMode,
      };
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), payload }),
      });
      if (!res.ok) throw new Error("save failed");
      setProjectStatus(`「${projectName}」を保存したで`);
      refreshProjectList();
    } catch (e) {
      setProjectStatus("保存に失敗した、通信環境を確認してや");
    }
  };

  const loadProject = async (key, name) => {
    setProjectStatus("読み込み中...");
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("not found");
      const project = await res.json();
      const payload = project.payload;
      const reIdRoom = (r) => ({
        ...r,
        id: nextIdSafe(),
        floors: r.floors.map((f) => ({ ...f, id: nextIdSafe() })),
        extraWalls: r.extraWalls.map((w) => ({ ...w, id: nextIdSafe() })),
        openings: {
          north: r.openings.north.map((o) => ({ ...o, id: nextIdSafe() })),
          south: r.openings.south.map((o) => ({ ...o, id: nextIdSafe() })),
          east: r.openings.east.map((o) => ({ ...o, id: nextIdSafe() })),
          west: r.openings.west.map((o) => ({ ...o, id: nextIdSafe() })),
        },
      });
      setRooms(payload.rooms.map(reIdRoom));
      setWallpaperWidth(payload.wallpaperWidth ?? "910");
      setCfWidth(payload.cfWidth ?? "1820");
      setWallpaperLossRate(payload.wallpaperLossRate ?? "10");
      setCfLossRate(payload.cfLossRate ?? "3");
      setLossMode(payload.lossMode ?? "perRoom");
      setProjectName(project.name ?? name);
      setProjectStatus(`「${project.name ?? name}」を読み込んだで`);
      setShowProjectList(false);
    } catch (e) {
      setProjectStatus("読み込みに失敗した");
    }
  };

  const deleteProject = async (key, name) => {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setProjectStatus(`「${name}」を削除したで`);
      refreshProjectList();
    } catch (e) {
      setProjectStatus("削除に失敗した");
    }
  };

  const results = rooms.map((r) => computeRoom(r, num(wallpaperWidth), num(cfWidth)));

  const totalWallpaperRaw = results.reduce((s, r, i) => s + (rooms[i].wallpaperExcluded ? 0 : r.wallpaperLenCm), 0);
  const totalCfRaw = results.reduce((s, r, i) => s + (rooms[i].cfExcluded ? 0 : r.cfLenCm), 0);

  const wallpaperLoss = num(wallpaperLossRate) / 100;
  const cfLoss = num(cfLossRate) / 100;

  const perRoomWallpaperTotal = results.reduce((s, r, i) => s + (rooms[i].wallpaperExcluded ? 0 : r.wallpaperLenCm * (1 + wallpaperLoss)), 0);
  const perRoomCfTotal = results.reduce((s, r, i) => s + (rooms[i].cfExcluded ? 0 : r.cfLenCm * (1 + cfLoss)), 0);
  const bulkWallpaperTotal = totalWallpaperRaw * (1 + wallpaperLoss);
  const bulkCfTotal = totalCfRaw * (1 + cfLoss);

  const finalWallpaper = lossMode === "perRoom" ? perRoomWallpaperTotal : bulkWallpaperTotal;
  const finalCf = lossMode === "perRoom" ? perRoomCfTotal : bulkCfTotal;

  const updateRoom = (id, next) => setRooms(rooms.map((r) => (r.id === id ? next : r)));
  const removeRoom = (id) => setRooms(rooms.filter((r) => r.id !== id));
  const addRoom = () => setRooms([...rooms, newRoom(`部屋${rooms.length + 1}`)]);

  return (
    <div
      className="wpcalc-root"
      style={{
        fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif",
        background: "#f6f9f2",
        minHeight: "100vh",
        padding: "16px",
        maxWidth: 480,
        margin: "0 auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <style>{`.wpcalc-root, .wpcalc-root *{box-sizing:border-box;} .wpcalc-root input{min-width:0;}`}</style>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#243d20" }}>壁紙・CF数量計算</div>
        <div style={{ fontSize: 13, color: "#5a6b52" }}>現場で採寸して、その場で発注数量を出す</div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #d8e3cd",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <SectionTitle accent="#5a6b52">物件の保存・呼び出し</SectionTitle>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="物件名(例:田中様邸)"
            style={{
              flex: "1 1 0%",
              minWidth: 0,
              padding: "10px 12px",
              fontSize: 15,
              border: "1px solid #cbd5c0",
              borderRadius: 6,
            }}
          />
          <button
            onClick={saveProject}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #4c6b40",
              background: "#4c6b40",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            保存
          </button>
        </div>
        <button
          onClick={() => {
            setShowProjectList(!showProjectList);
            if (!showProjectList) refreshProjectList();
          }}
          style={{
            fontSize: 13,
            padding: "6px 12px",
            borderRadius: 5,
            border: "1px solid #9ab08c",
            background: "#f3f8ee",
            color: "#4c6b40",
            cursor: "pointer",
          }}
        >
          保存済み物件を{showProjectList ? "閉じる" : "開く"}({savedProjects.length})
        </button>
        {projectStatus && <div style={{ fontSize: 12, color: "#5a6b52", marginTop: 6 }}>{projectStatus}</div>}

        {showProjectList && (
          <div style={{ marginTop: 10, borderTop: "1px solid #e4ecda", paddingTop: 10 }}>
            {savedProjects.length === 0 && <div style={{ fontSize: 13, color: "#9aa892" }}>保存済みの物件はまだないで</div>}
            {savedProjects.map((p) => (
              <div
                key={p.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #eef3e6",
                }}
              >
                <span style={{ fontSize: 14, color: "#33502e" }}>{p.name}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => loadProject(p.key, p.name)}
                    style={{
                      fontSize: 12,
                      padding: "5px 10px",
                      borderRadius: 5,
                      border: "1px solid #4c6b40",
                      background: "#e6f0dd",
                      color: "#33502e",
                      cursor: "pointer",
                    }}
                  >
                    開く
                  </button>
                  <button
                    onClick={() => deleteProject(p.key, p.name)}
                    style={{
                      fontSize: 12,
                      padding: "5px 10px",
                      borderRadius: 5,
                      border: "1px solid #d99",
                      background: "#fdeeee",
                      color: "#a33",
                      cursor: "pointer",
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #d8e3cd",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <SectionTitle accent="#5a6b52">資材・ロス率の設定</SectionTitle>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="壁紙の基本幅 mm">
            <NumInput value={wallpaperWidth} onChange={setWallpaperWidth} placeholder="910" />
          </Field>
          <Field label="CFの基本幅 mm">
            <NumInput value={cfWidth} onChange={setCfWidth} placeholder="1820" />
          </Field>
        </div>
        <Field label="壁紙ロス率(発注余裕分) %">
          <NumInput value={wallpaperLossRate} onChange={setWallpaperLossRate} placeholder="8" />
        </Field>
        <Field label="CFロス率(発注余裕分) %">
          <NumInput value={cfLossRate} onChange={setCfLossRate} placeholder="3" />
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button
            onClick={() => setLossMode("perRoom")}
            style={{
              flex: "1 1 0%", minWidth: 0,
              padding: "8px",
              borderRadius: 6,
              border: lossMode === "perRoom" ? "2px solid #4c6b40" : "1px solid #cbd5c0",
              background: lossMode === "perRoom" ? "#e6f0dd" : "#fff",
              color: "#33502e",
              fontWeight: lossMode === "perRoom" ? 700 : 400,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            部屋ごと割増
            <div style={{ fontSize: 11, fontWeight: 400, color: "#7a8a70" }}>小規模向け</div>
          </button>
          <button
            onClick={() => setLossMode("bulk")}
            style={{
              flex: "1 1 0%", minWidth: 0,
              padding: "8px",
              borderRadius: 6,
              border: lossMode === "bulk" ? "2px solid #4c6b40" : "1px solid #cbd5c0",
              background: lossMode === "bulk" ? "#e6f0dd" : "#fff",
              color: "#33502e",
              fontWeight: lossMode === "bulk" ? 700 : 400,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            全体一括割増
            <div style={{ fontSize: 11, fontWeight: 400, color: "#7a8a70" }}>部屋数が多い現場向け</div>
          </button>
        </div>
      </div>

      {rooms.map((room, i) => (
        <RoomCard
          key={room.id}
          room={room}
          result={results[i]}
          updateRoom={(next) => updateRoom(room.id, next)}
          removeRoom={() => removeRoom(room.id)}
        />
      ))}

      <button
        onClick={addRoom}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 8,
          border: "1px dashed #4c6b40",
          background: "#e6f0dd",
          color: "#33502e",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        + 部屋を追加
      </button>

      <div
        style={{
          background: "#243d20",
          borderRadius: 10,
          padding: 16,
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, opacity: 0.85 }}>発注数量サマリー</div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
          <span>壁紙(実数量合計)</span>
          <span>{round1(totalWallpaperRaw)} cm</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          <span>CF(実数量合計)</span>
          <span>{round1(totalCfRaw)} cm</span>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 10, fontSize: 12, opacity: 0.75 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>部屋ごと割増</span>
            <span>壁紙 {round1(perRoomWallpaperTotal)}cm / CF {round1(perRoomCfTotal)}cm</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span>全体一括割増</span>
            <span>壁紙 {round1(bulkWallpaperTotal)}cm / CF {round1(bulkCfTotal)}cm</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>発注量({lossMode === "perRoom" ? "部屋ごと割増" : "全体一括割増"})</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>壁紙 {roundUp(finalWallpaper)} cm</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>CF {roundUp(finalCf)} cm</div>
        </div>
      </div>
    </div>
  );
}
