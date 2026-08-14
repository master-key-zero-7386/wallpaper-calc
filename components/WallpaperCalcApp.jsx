"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  newRoom,
  emptyOpening,
  emptyWall,
  emptyFloor,
  num,
  round1,
  roundUp,
  computeRoom,
  computeShopPurchase,
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

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 2px",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14, color: "#33502e", lineHeight: 1.4 }}>{label}</span>
      <span
        style={{
          position: "relative",
          flexShrink: 0,
          width: 48,
          height: 28,
          borderRadius: 14,
          background: checked ? "#4c6b40" : "#c9d3c2",
          transition: "background 0.15s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
            transition: "left 0.15s ease",
          }}
        />
      </span>
    </div>
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

function RoomCard({ room, updateRoom, removeRoom, result, open, onToggleOpen }) {
  const setField = (patch) => updateRoom({ ...room, ...patch });

  return (
    <div
      style={{
        background: room.workDone ? "#f3f6f0" : "#fff",
        border: room.workDone ? "1px solid #b9c9ae" : "1px solid #d8e3cd",
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
          background: room.workDone ? "#dfe7d8" : "#eef4e6",
          cursor: "pointer",
        }}
        onClick={onToggleOpen}
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
            {room.workDone && <span style={{ color: "#4c6b40", fontWeight: 700 }}>済 ・</span>}
            壁{round1(result.wallpaperAreaM2)}㎡/{round1(result.wallpaperLenCm)}cm{!room.wallpaperEnabled ? "(除外)" : ""}・床{round1(result.floorAreaM2)}㎡/{round1(room.useOtherSheet ? result.otherSheetLenCm : result.cfLenCm)}cm{!room.cfEnabled ? "(除外)" : ""}{room.useOtherSheet ? "(別シート)" : ""}
          </span>
          <span style={{ fontSize: 18, color: "#5a6b52" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: 14 }}>
          <ToggleSwitch
            checked={room.workDone}
            onChange={(v) => setField({ workDone: v })}
            label={room.workDone ? "施工完了(済み)" : "施工完了にする"}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ flex: "1 1 auto" }}>
              <SectionTitle>床 (クッションフロア用)</SectionTitle>
            </div>
            <button
              onClick={() => setField({ useOtherSheet: !room.useOtherSheet })}
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 5,
                border: room.useOtherSheet ? "1px solid #b8860b" : "1px solid #9ab08c",
                background: room.useOtherSheet ? "#f5e6b8" : "#f3f8ee",
                color: room.useOtherSheet ? "#7a5a10" : "#4c6b40",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginBottom: 10,
              }}
            >
              {room.useOtherSheet ? "別シート使用中" : "別シートを使用"}
            </button>
          </div>
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

          <ToggleSwitch
            checked={room.cfEnabled}
            onChange={(v) => setField({ cfEnabled: v })}
            label={
              room.useOtherSheet
                ? room.cfEnabled
                  ? "別シートを貼る (発注数量に含む)"
                  : "別シートを貼らない (発注数量に含まない)"
                : room.cfEnabled
                ? "CFを貼る (発注数量に含む)"
                : "CFを貼らない (発注数量に含まない)"
            }
          />

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

          <ToggleSwitch
            checked={room.ceilingEnabled}
            onChange={(v) => setField({ ceilingEnabled: v })}
            label={room.ceilingEnabled ? "天井に壁紙を貼る (床と同面積を発注数量に含む)" : "天井に壁紙を貼らない (発注数量に含まない)"}
          />

          <ToggleSwitch
            checked={room.wallpaperEnabled}
            onChange={(v) => setField({ wallpaperEnabled: v })}
            label={room.wallpaperEnabled ? "壁紙を貼る (壁紙発注数量に含む)" : "壁紙を貼らない (発注数量に含まない)"}
          />

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
              {!room.wallpaperEnabled && (
                <div style={{ fontSize: 11, color: "#a33", marginTop: 2 }}>寸法メモのみ:発注数量の合計には加算されません</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: !room.wallpaperEnabled ? 8 : 0 }}>
                <span>{room.useOtherSheet ? "別シート必要長さ(実数量)" : "CF必要長さ(実数量)"}</span>
                <span>
                  {round1(room.useOtherSheet ? result.otherSheetLenCm : result.cfLenCm)} cm
                  {room.cfPattern ? `(${room.useOtherSheet ? result.otherSheetStrips : result.cfStrips}枚継ぎ)` : ""}
                </span>
              </div>
              {!room.cfEnabled && (
                <div style={{ fontSize: 11, color: "#a33", marginTop: 2 }}>寸法メモのみ:発注数量の合計には加算されません</div>
              )}
              {room.cfPattern && (
                <div style={{ fontSize: 11, color: "#b8860b", marginTop: 2 }}>
                  柄あり計算:幅方向がロール幅を超えるため{room.useOtherSheet ? result.otherSheetStrips : result.cfStrips}枚を継いで施工する前提の長さ
                </div>
              )}
              {(room.useOtherSheet ? result.otherSheetNote : result.cfNote) && (
                <div style={{ fontSize: 11, color: "#a33", marginTop: 2 }}>
                  {room.useOtherSheet ? result.otherSheetNote : result.cfNote}
                </div>
              )}
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
  const [otherSheetWidth, setOtherSheetWidth] = useState("1820");
  const [wallpaperLossRate, setWallpaperLossRate] = useState("8");
  const [cfLossRate, setCfLossRate] = useState("3");
  const [otherSheetLossRate, setOtherSheetLossRate] = useState("3");
  const [lossMode, setLossMode] = useState("perRoom");

  const [projectName, setProjectName] = useState("");
  const [savedProjects, setSavedProjects] = useState([]);
  const [projectStatus, setProjectStatus] = useState("");
  const [showProjectList, setShowProjectList] = useState(false);
  const [selectedProjectKeys, setSelectedProjectKeys] = useState([]);
  const [combineStatus, setCombineStatus] = useState("");
  const [combineResult, setCombineResult] = useState(null);
  const [openRooms, setOpenRooms] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(true);

  const defaultMaterialShops = (prefix) => [
    { id: `${prefix}A`, name: "店舗A", price: "", unit: "m", shipping: "", url: "" },
    { id: `${prefix}B`, name: "店舗B", price: "", unit: "m", shipping: "", url: "" },
    { id: `${prefix}C`, name: "店舗C", price: "", unit: "m", shipping: "", url: "" },
  ];
  const [wallpaperShops, setWallpaperShops] = useState(defaultMaterialShops("wp"));
  const [cfShops, setCfShops] = useState(defaultMaterialShops("cf"));
  const [otherSheetShops, setOtherSheetShops] = useState(defaultMaterialShops("os"));
  const [adoptedWallpaperShopId, setAdoptedWallpaperShopId] = useState(null);
  const [adoptedCfShopId, setAdoptedCfShopId] = useState(null);
  const [adoptedOtherSheetShopId, setAdoptedOtherSheetShopId] = useState(null);
  const [wallpaperCompareOpen, setWallpaperCompareOpen] = useState(true);
  const [cfCompareOpen, setCfCompareOpen] = useState(true);
  const [otherSheetCompareOpen, setOtherSheetCompareOpen] = useState(true);
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [favoriteShops, setFavoriteShops] = useState([]);
  const [newFavName, setNewFavName] = useState("");
  const [newFavUrl, setNewFavUrl] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("wpcalc-favorite-shops");
      if (raw) setFavoriteShops(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("wpcalc-favorite-shops", JSON.stringify(favoriteShops));
    } catch (e) {
      // ignore
    }
  }, [favoriteShops]);

  const updateWallpaperShop = (i, patch) =>
    setWallpaperShops(wallpaperShops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateCfShop = (i, patch) => setCfShops(cfShops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateOtherSheetShop = (i, patch) =>
    setOtherSheetShops(otherSheetShops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const toggleAdoptWallpaperShop = (id) => setAdoptedWallpaperShopId((prev) => (prev === id ? null : id));
  const toggleAdoptCfShop = (id) => setAdoptedCfShopId((prev) => (prev === id ? null : id));
  const toggleAdoptOtherSheetShop = (id) => setAdoptedOtherSheetShopId((prev) => (prev === id ? null : id));
  const addFavorite = () => {
    if (!newFavUrl.trim()) return;
    setFavoriteShops([
      ...favoriteShops,
      { id: nextIdSafe(), name: newFavName.trim() || newFavUrl.trim(), url: newFavUrl.trim() },
    ]);
    setNewFavName("");
    setNewFavUrl("");
  };
  const removeFavorite = (id) => setFavoriteShops(favoriteShops.filter((f) => f.id !== id));

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
      return false;
    }
    setProjectStatus("保存中...");
    try {
      const payload = {
        rooms,
        wallpaperWidth,
        cfWidth,
        otherSheetWidth,
        wallpaperLossRate,
        cfLossRate,
        otherSheetLossRate,
        lossMode,
        wallpaperShops,
        cfShops,
        otherSheetShops,
        adoptedWallpaperShopId,
        adoptedCfShopId,
        adoptedOtherSheetShopId,
      };
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), payload }),
      });
      if (!res.ok) throw new Error("save failed");
      setProjectStatus(`「${projectName}」を保存したで`);
      refreshProjectList();
      return true;
    } catch (e) {
      setProjectStatus("保存に失敗した、通信環境を確認してや");
      return false;
    }
  };

  const resetToBlankProject = () => {
    setRooms([newRoom("部屋1")]);
    setWallpaperWidth("910");
    setCfWidth("1820");
    setOtherSheetWidth("1820");
    setWallpaperLossRate("8");
    setCfLossRate("3");
    setOtherSheetLossRate("3");
    setLossMode("perRoom");
    setWallpaperShops(defaultMaterialShops("wp"));
    setCfShops(defaultMaterialShops("cf"));
    setOtherSheetShops(defaultMaterialShops("os"));
    setAdoptedWallpaperShopId(null);
    setAdoptedCfShopId(null);
    setAdoptedOtherSheetShopId(null);
    setProjectName("");
    setProjectStatus("新規物件を作成したで");
  };

  const startNewProject = async () => {
    const wantsSave = window.confirm(
      "現在編集中の内容を保存しますか?\n(OK:保存してから新規作成 / キャンセル:保存せず新規作成)"
    );
    if (wantsSave) {
      const ok = await saveProject();
      if (!ok) return;
    }
    resetToBlankProject();
  };

  const toggleSelectProject = (key) => {
    setSelectedProjectKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const combineProjects = async () => {
    if (selectedProjectKeys.length === 0) {
      setCombineStatus("合算する物件を選んでや");
      return;
    }
    setCombineStatus("計算中...");
    setCombineResult(null);
    try {
      const projects = await Promise.all(
        selectedProjectKeys.map(async (key) => {
          const res = await fetch(`/api/projects/${encodeURIComponent(key)}`);
          if (!res.ok) throw new Error("not found");
          return res.json();
        })
      );

      const items = projects.map((project) => {
        const payload = project.payload;
        const wWidth = num(payload.wallpaperWidth);
        const cWidth = num(payload.cfWidth);
        const wLoss = num(payload.wallpaperLossRate) / 100;
        const cLoss = num(payload.cfLossRate) / 100;
        const perRoom = (payload.lossMode ?? "perRoom") === "perRoom";
        const results = payload.rooms.map((r) => computeRoom(r, wWidth, cWidth));

        const rawWallpaperCm = results.reduce(
          (s, r, i) => s + ((payload.rooms[i].wallpaperEnabled ?? true) ? r.wallpaperLenCm : 0),
          0
        );
        const rawCfCm = results.reduce(
          (s, r, i) => s + ((payload.rooms[i].cfEnabled ?? true) ? r.cfLenCm : 0),
          0
        );
        const wallpaperCm = perRoom
          ? results.reduce(
              (s, r, i) => s + ((payload.rooms[i].wallpaperEnabled ?? true) ? r.wallpaperLenCm * (1 + wLoss) : 0),
              0
            )
          : rawWallpaperCm * (1 + wLoss);
        const cfCm = perRoom
          ? results.reduce(
              (s, r, i) => s + ((payload.rooms[i].cfEnabled ?? true) ? r.cfLenCm * (1 + cLoss) : 0),
              0
            )
          : rawCfCm * (1 + cLoss);

        return { name: project.name, wallpaperWidth: wWidth, cfWidth: cWidth, wallpaperCm, cfCm };
      });

      const wallpaperOk = new Set(items.map((it) => it.wallpaperWidth)).size === 1;
      const cfOk = new Set(items.map((it) => it.cfWidth)).size === 1;

      setCombineResult({
        items,
        wallpaperOk,
        cfOk,
        wallpaperTotalCm: wallpaperOk ? items.reduce((s, it) => s + it.wallpaperCm, 0) : 0,
        cfTotalCm: cfOk ? items.reduce((s, it) => s + it.cfCm, 0) : 0,
      });
      setCombineStatus("");
    } catch (e) {
      setCombineStatus("合算に失敗した");
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
        cfEnabled: r.cfEnabled ?? true,
        wallpaperEnabled: r.wallpaperEnabled ?? true,
        useOtherSheet: r.useOtherSheet ?? false,
        workDone: r.workDone ?? false,
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
      setOtherSheetWidth(payload.otherSheetWidth ?? "1820");
      setWallpaperLossRate(payload.wallpaperLossRate ?? "10");
      setCfLossRate(payload.cfLossRate ?? "3");
      setOtherSheetLossRate(payload.otherSheetLossRate ?? "3");
      setLossMode(payload.lossMode ?? "perRoom");
      setWallpaperShops(payload.wallpaperShops ?? defaultMaterialShops("wp"));
      setCfShops(payload.cfShops ?? defaultMaterialShops("cf"));
      setOtherSheetShops(payload.otherSheetShops ?? defaultMaterialShops("os"));
      setAdoptedWallpaperShopId(payload.adoptedWallpaperShopId ?? null);
      setAdoptedCfShopId(payload.adoptedCfShopId ?? null);
      setAdoptedOtherSheetShopId(payload.adoptedOtherSheetShopId ?? null);
      setProjectName(project.name ?? name);
      setProjectStatus(`「${project.name ?? name}」を開きました`);
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

  const results = rooms.map((r) => computeRoom(r, num(wallpaperWidth), num(cfWidth), num(otherSheetWidth)));
  const hasOtherSheetRooms = rooms.some((r) => r.useOtherSheet);

  const totalWallpaperRaw = results.reduce((s, r, i) => s + (rooms[i].wallpaperEnabled ? r.wallpaperLenCm : 0), 0);
  const totalCfRaw = results.reduce((s, r, i) => s + (rooms[i].cfEnabled && !rooms[i].useOtherSheet ? r.cfLenCm : 0), 0);
  const totalOtherSheetRaw = results.reduce((s, r, i) => s + (rooms[i].cfEnabled && rooms[i].useOtherSheet ? r.otherSheetLenCm : 0), 0);

  const wallpaperLoss = num(wallpaperLossRate) / 100;
  const cfLoss = num(cfLossRate) / 100;
  const otherSheetLoss = num(otherSheetLossRate) / 100;

  // 部屋ごと割増:部屋単位で切り上げてから合計(部屋ごとに端材が出て使い回せない前提)
  const perRoomWallpaperTotal = results.reduce((s, r, i) => s + (rooms[i].wallpaperEnabled ? roundUp(r.wallpaperLenCm * (1 + wallpaperLoss)) : 0), 0);
  const perRoomCfTotal = results.reduce((s, r, i) => s + (rooms[i].cfEnabled && !rooms[i].useOtherSheet ? roundUp(r.cfLenCm * (1 + cfLoss)) : 0), 0);
  const perRoomOtherSheetTotal = results.reduce((s, r, i) => s + (rooms[i].cfEnabled && rooms[i].useOtherSheet ? roundUp(r.otherSheetLenCm * (1 + otherSheetLoss)) : 0), 0);
  // 全体一括割増:合計してから1回だけ切り上げ(端材を他の部屋に回せる前提)
  const bulkWallpaperTotal = totalWallpaperRaw * (1 + wallpaperLoss);
  const bulkCfTotal = totalCfRaw * (1 + cfLoss);
  const bulkOtherSheetTotal = totalOtherSheetRaw * (1 + otherSheetLoss);

  const finalWallpaper = lossMode === "perRoom" ? perRoomWallpaperTotal : bulkWallpaperTotal;
  const finalCf = lossMode === "perRoom" ? perRoomCfTotal : bulkCfTotal;
  const finalOtherSheet = lossMode === "perRoom" ? perRoomOtherSheetTotal : bulkOtherSheetTotal;

  const unfinishedIdx = rooms.map((r, i) => (r.workDone ? -1 : i)).filter((i) => i >= 0);
  const remainingWallpaperRaw = unfinishedIdx.reduce((s, i) => s + (rooms[i].wallpaperEnabled ? results[i].wallpaperLenCm : 0), 0);
  const remainingCfRaw = unfinishedIdx.reduce((s, i) => s + (rooms[i].cfEnabled && !rooms[i].useOtherSheet ? results[i].cfLenCm : 0), 0);
  const remainingOtherSheetRaw = unfinishedIdx.reduce((s, i) => s + (rooms[i].cfEnabled && rooms[i].useOtherSheet ? results[i].otherSheetLenCm : 0), 0);
  const remainingWallpaperPerRoom = unfinishedIdx.reduce((s, i) => s + (rooms[i].wallpaperEnabled ? roundUp(results[i].wallpaperLenCm * (1 + wallpaperLoss)) : 0), 0);
  const remainingCfPerRoom = unfinishedIdx.reduce((s, i) => s + (rooms[i].cfEnabled && !rooms[i].useOtherSheet ? roundUp(results[i].cfLenCm * (1 + cfLoss)) : 0), 0);
  const remainingOtherSheetPerRoom = unfinishedIdx.reduce((s, i) => s + (rooms[i].cfEnabled && rooms[i].useOtherSheet ? roundUp(results[i].otherSheetLenCm * (1 + otherSheetLoss)) : 0), 0);
  const remainingWallpaperBulk = roundUp(remainingWallpaperRaw * (1 + wallpaperLoss));
  const remainingCfBulk = roundUp(remainingCfRaw * (1 + cfLoss));
  const remainingOtherSheetBulk = roundUp(remainingOtherSheetRaw * (1 + otherSheetLoss));
  const remainingWallpaper = lossMode === "perRoom" ? remainingWallpaperPerRoom : remainingWallpaperBulk;
  const remainingCf = lossMode === "perRoom" ? remainingCfPerRoom : remainingCfBulk;
  const remainingOtherSheet = lossMode === "perRoom" ? remainingOtherSheetPerRoom : remainingOtherSheetBulk;

  const updateRoom = (id, next) => setRooms(rooms.map((r) => (r.id === id ? next : r)));
  const removeRoom = (id) => setRooms(rooms.filter((r) => r.id !== id));
  const addRoom = () => setRooms([...rooms, newRoom(`部屋${rooms.length + 1}`)]);

  const finalWallpaperM = finalWallpaper / 100;
  const finalCfM = finalCf / 100;
  const finalOtherSheetM = finalOtherSheet / 100;

  const wallpaperPurchases = wallpaperShops.map((s) => computeShopPurchase(s, finalWallpaperM));
  const wallpaperShopSubtotals = wallpaperPurchases.map((p) => p.subtotal);
  const wallpaperShopTotals = wallpaperShops.map((s, i) => wallpaperShopSubtotals[i] + num(s.shipping));
  const wallpaperNormalizedPrices = wallpaperShops
    .map((s, i) => (num(s.price) > 0 ? wallpaperPurchases[i].normalizedPricePerM : null))
    .filter((p) => p !== null);
  const cheapestWallpaperPrice = wallpaperNormalizedPrices.length > 0 ? Math.min(...wallpaperNormalizedPrices) : null;

  const cfPurchases = cfShops.map((s) => computeShopPurchase(s, finalCfM));
  const cfShopSubtotals = cfPurchases.map((p) => p.subtotal);
  const cfShopTotals = cfShops.map((s, i) => cfShopSubtotals[i] + num(s.shipping));
  const cfNormalizedPrices = cfShops
    .map((s, i) => (num(s.price) > 0 ? cfPurchases[i].normalizedPricePerM : null))
    .filter((p) => p !== null);
  const cheapestCfPrice = cfNormalizedPrices.length > 0 ? Math.min(...cfNormalizedPrices) : null;

  const otherSheetPurchases = otherSheetShops.map((s) => computeShopPurchase(s, finalOtherSheetM));
  const otherSheetShopSubtotals = otherSheetPurchases.map((p) => p.subtotal);
  const otherSheetShopTotals = otherSheetShops.map((s, i) => otherSheetShopSubtotals[i] + num(s.shipping));
  const otherSheetNormalizedPrices = otherSheetShops
    .map((s, i) => (num(s.price) > 0 ? otherSheetPurchases[i].normalizedPricePerM : null))
    .filter((p) => p !== null);
  const cheapestOtherSheetPrice = otherSheetNormalizedPrices.length > 0 ? Math.min(...otherSheetNormalizedPrices) : null;

  const adoptedWallpaperShopIdx = wallpaperShops.findIndex((s) => s.id === adoptedWallpaperShopId);
  const adoptedWallpaperShop = adoptedWallpaperShopIdx >= 0 ? wallpaperShops[adoptedWallpaperShopIdx] : null;
  const adoptedWallpaperSubtotal = adoptedWallpaperShopIdx >= 0 ? wallpaperShopSubtotals[adoptedWallpaperShopIdx] : 0;
  const adoptedWallpaperShipping = adoptedWallpaperShop ? num(adoptedWallpaperShop.shipping) : 0;
  const adoptedWallpaperTotal = adoptedWallpaperShopIdx >= 0 ? wallpaperShopTotals[adoptedWallpaperShopIdx] : 0;

  const adoptedCfShopIdx = cfShops.findIndex((s) => s.id === adoptedCfShopId);
  const adoptedCfShop = adoptedCfShopIdx >= 0 ? cfShops[adoptedCfShopIdx] : null;
  const adoptedCfSubtotal = adoptedCfShopIdx >= 0 ? cfShopSubtotals[adoptedCfShopIdx] : 0;
  const adoptedCfShipping = adoptedCfShop ? num(adoptedCfShop.shipping) : 0;
  const adoptedCfTotal = adoptedCfShopIdx >= 0 ? cfShopTotals[adoptedCfShopIdx] : 0;

  const adoptedOtherSheetShopIdx = otherSheetShops.findIndex((s) => s.id === adoptedOtherSheetShopId);
  const adoptedOtherSheetShop = adoptedOtherSheetShopIdx >= 0 ? otherSheetShops[adoptedOtherSheetShopIdx] : null;
  const adoptedOtherSheetSubtotal = adoptedOtherSheetShopIdx >= 0 ? otherSheetShopSubtotals[adoptedOtherSheetShopIdx] : 0;
  const adoptedOtherSheetShipping = adoptedOtherSheetShop ? num(adoptedOtherSheetShop.shipping) : 0;
  const adoptedOtherSheetTotal = adoptedOtherSheetShopIdx >= 0 ? otherSheetShopTotals[adoptedOtherSheetShopIdx] : 0;

  const remainingWallpaperCost = adoptedWallpaperShop
    ? computeShopPurchase(adoptedWallpaperShop, remainingWallpaper / 100).subtotal
    : 0;
  const remainingCfCost = adoptedCfShop ? computeShopPurchase(adoptedCfShop, remainingCf / 100).subtotal : 0;
  const remainingOtherSheetCost = adoptedOtherSheetShop
    ? computeShopPurchase(adoptedOtherSheetShop, remainingOtherSheet / 100).subtotal
    : 0;

  const yen = (n) => Math.round(n).toLocaleString("ja-JP");

  const renderMaterialShopCard = (shop, i, updateFn, cheapestPrice, qtyM, badgeColor, adoptedId, toggleAdopt) => {
    const price = num(shop.price);
    const shipping = num(shop.shipping);
    const purchase = computeShopPurchase(shop, qtyM);
    const subtotal = purchase.subtotal;
    const total = subtotal + shipping;
    const isCheapest = cheapestPrice !== null && price > 0 && purchase.normalizedPricePerM === cheapestPrice;
    const isAdopted = adoptedId === shop.id;
    const unitLabel = shop.unit === "10cm" ? "10cm" : shop.unit === "cm" ? "cm" : "m";
    return (
      <div
        key={shop.id}
        style={{
          border: isAdopted ? `2px solid ${badgeColor}` : isCheapest ? `2px dashed ${badgeColor}` : "1px solid #d8e3cd",
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
          background: isAdopted ? "#f5faf1" : "#fafcf7",
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
          <input
            value={shop.name}
            onChange={(e) => updateFn(i, { name: e.target.value })}
            style={{
              flex: "1 1 0%",
              minWidth: 0,
              fontWeight: 700,
              fontSize: 14,
              padding: "6px 8px",
              border: "1px solid #cbd5c0",
              borderRadius: 5,
              color: "#33502e",
            }}
          />
          {isCheapest && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                background: badgeColor,
                padding: "3px 8px",
                borderRadius: 10,
                whiteSpace: "nowrap",
              }}
            >
              最安
            </span>
          )}
          <button
            onClick={() => toggleAdopt(shop.id)}
            style={{
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 5,
              border: `1px solid ${badgeColor}`,
              background: isAdopted ? badgeColor : "#fff",
              color: isAdopted ? "#fff" : badgeColor,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isAdopted ? "採用中" : "採用"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="単価">
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                <NumInput value={shop.price} onChange={(v) => updateFn(i, { price: v })} placeholder="0" />
              </div>
              <select
                value={shop.unit || "m"}
                onChange={(e) => updateFn(i, { unit: e.target.value })}
                style={{
                  flexShrink: 0,
                  padding: "0 6px",
                  fontSize: 14,
                  border: "1px solid #cbd5c0",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#33502e",
                }}
              >
                <option value="m">円/m</option>
                <option value="10cm">円/10cm</option>
                <option value="cm">円/cm</option>
              </select>
            </div>
          </Field>
          <Field label="送料 円(別途)">
            <NumInput value={shop.shipping} onChange={(v) => updateFn(i, { shipping: v })} placeholder="0" />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input
            value={shop.url}
            onChange={(e) => updateFn(i, { url: e.target.value })}
            placeholder="単価を採用したショップのURL"
            style={{
              flex: "1 1 0%",
              minWidth: 0,
              padding: "7px 8px",
              fontSize: 13,
              border: "1px solid #cbd5c0",
              borderRadius: 5,
            }}
          />
          {shop.url && (
            <a
              href={shop.url}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "7px 10px",
                borderRadius: 5,
                border: "1px solid #9ab08c",
                background: "#f3f8ee",
                color: "#4c6b40",
                fontSize: 12,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              開く
            </a>
          )}
        </div>
        {favoriteShops.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
            {favoriteShops.map((f) => (
              <button
                key={f.id}
                onClick={() => updateFn(i, { url: f.url })}
                title={f.url}
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 12,
                  border: "1px solid #9ab08c",
                  background: "#fff",
                  color: "#4c6b40",
                  cursor: "pointer",
                }}
              >
                ★{f.name}
              </button>
            ))}
          </div>
        )}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px dashed #d8e3cd",
            fontSize: 13,
            color: "#33502e",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>合計額({round1(purchase.purchasedQtyM)}m発注)</span>
            <span>¥{yen(subtotal)}</span>
          </div>
          <div style={{ fontSize: 11, color: "#7a8a70", marginTop: 1 }}>
            実使用{round1(qtyM)}m → {unitLabel}単位で{purchase.units}コマ({round1(purchase.purchasedQtyM)}m)発注
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span>送料(別途)</span>
            <span>¥{yen(shipping)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              paddingTop: 6,
              borderTop: "1px solid #e4ecda",
              fontWeight: 700,
              color: "#243d20",
            }}
          >
            <span>総額</span>
            <span>¥{yen(total)}</span>
          </div>
        </div>
      </div>
    );
  };

  const toggleRoomOpen = (id) => setOpenRooms((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  const allRoomsOpen = rooms.every((r) => openRooms[r.id] ?? true);
  const toggleAllRooms = () => {
    const next = !allRoomsOpen;
    setOpenRooms(Object.fromEntries(rooms.map((r) => [r.id, next])));
  };

  const exportExcel = () => {
    const lossModeLabel = lossMode === "perRoom" ? "部屋ごと割増" : "全体一括割増";
    const unitLabelOf = (shop) => (shop.unit === "10cm" ? "円/10cm" : shop.unit === "cm" ? "円/cm" : "円/m");
    const shopExcelRows = (label, shops, subtotals, totals, adoptedId) =>
      shops.map((shop, i) => [
        label,
        shop.name,
        num(shop.price),
        unitLabelOf(shop),
        num(shop.shipping),
        Math.round(subtotals[i]),
        Math.round(totals[i]),
        shop.id === adoptedId ? "採用" : "",
        shop.url,
      ]);
    const rows = [
      [`物件名: ${projectName || "(未保存)"}`],
      [`出力日: ${new Date().toLocaleDateString("ja-JP")}`],
      [],
      ["部屋名", "床面積(㎡)", "天井面積(㎡)", "壁紙対象合計(㎡)", "壁紙必要長さ(cm)", "床材必要長さ(cm)", "床材種別", "壁紙", "床材", "発注"],
      ...rooms.map((room, i) => {
        const r = results[i];
        return [
          room.name,
          round1(r.floorAreaM2),
          round1(r.ceilingAreaM2),
          round1(r.wallpaperAreaM2),
          round1(r.wallpaperLenCm),
          round1(room.useOtherSheet ? r.otherSheetLenCm : r.cfLenCm),
          room.useOtherSheet ? "別シート" : "CF",
          room.wallpaperEnabled ? "対象" : "除外",
          room.cfEnabled ? "対象" : "除外",
          room.workDone ? "施工完了" : "未完了",
        ];
      }),
      [],
      ["設定"],
      ["壁紙幅(mm)", num(wallpaperWidth)],
      ["CF幅(mm)", num(cfWidth)],
      ...(hasOtherSheetRooms ? [["別シート幅(mm)", num(otherSheetWidth)]] : []),
      ["壁紙ロス率(%)", num(wallpaperLossRate)],
      ["CFロス率(%)", num(cfLossRate)],
      ...(hasOtherSheetRooms ? [["別シートロス率(%)", num(otherSheetLossRate)]] : []),
      ["割増方式", lossModeLabel],
      [],
      ["発注数量サマリー"],
      ["壁紙(実数量合計) cm", round1(totalWallpaperRaw)],
      ["CF(実数量合計) cm", round1(totalCfRaw)],
      ...(hasOtherSheetRooms ? [["別シート(実数量合計) cm", round1(totalOtherSheetRaw)]] : []),
      ["部屋ごと割増 壁紙 cm", round1(perRoomWallpaperTotal)],
      ["部屋ごと割増 CF cm", round1(perRoomCfTotal)],
      ...(hasOtherSheetRooms ? [["部屋ごと割増 別シート cm", round1(perRoomOtherSheetTotal)]] : []),
      ["全体一括割増 壁紙 cm", round1(bulkWallpaperTotal)],
      ["全体一括割増 CF cm", round1(bulkCfTotal)],
      ...(hasOtherSheetRooms ? [["全体一括割増 別シート cm", round1(bulkOtherSheetTotal)]] : []),
      [`総数(${lossModeLabel}) 壁紙 cm`, roundUp(finalWallpaper)],
      [`総数(${lossModeLabel}) CF cm`, roundUp(finalCf)],
      ...(hasOtherSheetRooms ? [[`総数(${lossModeLabel}) 別シート cm`, roundUp(finalOtherSheet)]] : []),
      ["残数量(施工完了の部屋を除く) 壁紙 cm", remainingWallpaper],
      ["残数量(施工完了の部屋を除く) CF cm", remainingCf],
      ...(hasOtherSheetRooms ? [["残数量(施工完了の部屋を除く) 別シート cm", remainingOtherSheet]] : []),
      [],
      ["仕入れ比較(全店舗)"],
      ["材料", "店舗名", "単価", "単位", "送料", "合計額", "総額", "採用", "URL"],
      ...shopExcelRows("壁紙", wallpaperShops, wallpaperShopSubtotals, wallpaperShopTotals, adoptedWallpaperShopId),
      ...shopExcelRows("CF", cfShops, cfShopSubtotals, cfShopTotals, adoptedCfShopId),
      ...(hasOtherSheetRooms
        ? shopExcelRows("別シート", otherSheetShops, otherSheetShopSubtotals, otherSheetShopTotals, adoptedOtherSheetShopId)
        : []),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 8 }, { wch: 32 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "発注数量");
    XLSX.writeFile(wb, `${(projectName || "壁紙CF計算").trim()}_発注数量.xlsx`);
  };

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
        <div style={{ display: "flex", gap: 8 }}>
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
          <button
            onClick={startNewProject}
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
            新規物件
          </button>
        </div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedProjectKeys.includes(p.key)}
                    onChange={() => toggleSelectProject(p.key)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 14, color: "#33502e" }}>{p.name}</span>
                </div>
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

            {savedProjects.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={combineProjects}
                  style={{
                    fontSize: 13,
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "1px solid #4c6b40",
                    background: "#4c6b40",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  選択した物件を合算する({selectedProjectKeys.length})
                </button>
                {combineStatus && <div style={{ fontSize: 12, color: "#5a6b52", marginTop: 6 }}>{combineStatus}</div>}
              </div>
            )}

            {combineResult && (
              <div style={{ marginTop: 12, background: "#243d20", color: "#fff", borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>合算発注数量(実数量・{combineResult.items.length}件)</div>
                {combineResult.wallpaperOk ? (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>壁紙合計</span>
                    <span>{round1(combineResult.wallpaperTotalCm)} cm</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#f0b0b0" }}>設定されている壁紙の幅が違います。合算できません。</div>
                )}
                {combineResult.cfOk ? (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span>CF合計</span>
                    <span>{round1(combineResult.cfTotalCm)} cm</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#f0b0b0", marginTop: 4 }}>設定されているCFの幅が違います。合算できません。</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#243d20",
          borderRadius: 10,
          padding: 16,
          color: "#fff",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.85 }}>発注数量サマリー</div>
          <button
            onClick={exportExcel}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 5,
              border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Excel出力
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
          <span>壁紙(実数量合計)</span>
          <span>{round1(totalWallpaperRaw)} cm</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: hasOtherSheetRooms ? 4 : 10 }}>
          <span>CF(実数量合計)</span>
          <span>{round1(totalCfRaw)} cm</span>
        </div>
        {hasOtherSheetRooms && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
            <span>別シート(実数量合計)</span>
            <span>{round1(totalOtherSheetRaw)} cm</span>
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 10, fontSize: 12, opacity: 0.75 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>部屋ごと割増</span>
            <span>
              壁紙 {round1(perRoomWallpaperTotal)}cm / CF {round1(perRoomCfTotal)}cm
              {hasOtherSheetRooms && ` / 別シート ${round1(perRoomOtherSheetTotal)}cm`}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span>全体一括割増</span>
            <span>
              壁紙 {round1(bulkWallpaperTotal)}cm / CF {round1(bulkCfTotal)}cm
              {hasOtherSheetRooms && ` / 別シート ${round1(bulkOtherSheetTotal)}cm`}
            </span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>総数({lossMode === "perRoom" ? "部屋ごと割増" : "全体一括割増"})</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>壁紙 {roundUp(finalWallpaper)} cm</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#a8d98a" }}>総額¥{yen(adoptedWallpaperTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, opacity: 0.65, marginBottom: 6 }}>
            合計額¥{yen(adoptedWallpaperSubtotal)} + 送料¥{yen(adoptedWallpaperShipping)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>CF {roundUp(finalCf)} cm</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#a8d98a" }}>総額¥{yen(adoptedCfTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, opacity: 0.65, marginBottom: hasOtherSheetRooms ? 6 : 0 }}>
            合計額¥{yen(adoptedCfSubtotal)} + 送料¥{yen(adoptedCfShipping)}
          </div>
          {hasOtherSheetRooms && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 26, fontWeight: 800 }}>別シート {roundUp(finalOtherSheet)} cm</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#a8d98a" }}>総額¥{yen(adoptedOtherSheetTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, opacity: 0.65 }}>
                合計額¥{yen(adoptedOtherSheetSubtotal)} + 送料¥{yen(adoptedOtherSheetShipping)}
              </div>
            </>
          )}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>残数量(施工完了の部屋を除く)</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#ffd27a" }}>壁紙 {remainingWallpaper} cm</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ffd27a" }}>仕入れ予定額¥{yen(remainingWallpaperCost)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#ffd27a" }}>CF {remainingCf} cm</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ffd27a" }}>仕入れ予定額¥{yen(remainingCfCost)}</span>
          </div>
          {hasOtherSheetRooms && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#ffd27a" }}>別シート {remainingOtherSheet} cm</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffd27a" }}>仕入れ予定額¥{yen(remainingOtherSheetCost)}</span>
            </div>
          )}
        </div>
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
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          <SectionTitle accent="#5a6b52">資材・ロス率の設定</SectionTitle>
          <span style={{ fontSize: 16, color: "#5a6b52" }}>{settingsOpen ? "▲" : "▼"}</span>
        </div>
        {settingsOpen && (
          <>
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
            {hasOtherSheetRooms && (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label="別シートの基本幅 mm">
                    <NumInput value={otherSheetWidth} onChange={setOtherSheetWidth} placeholder="1820" />
                  </Field>
                  <Field label="別シートロス率 %">
                    <NumInput value={otherSheetLossRate} onChange={setOtherSheetLossRate} placeholder="3" />
                  </Field>
                </div>
              </>
            )}
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
          </>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button
          onClick={toggleAllRooms}
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
          部屋を全部{allRoomsOpen ? "閉じる" : "開く"}
        </button>
      </div>

      {rooms.map((room, i) => (
        <RoomCard
          key={room.id}
          room={room}
          result={results[i]}
          updateRoom={(next) => updateRoom(room.id, next)}
          removeRoom={() => removeRoom(room.id)}
          open={openRooms[room.id] ?? true}
          onToggleOpen={() => toggleRoomOpen(room.id)}
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
          background: "#fff",
          border: "1px solid #d8e3cd",
          borderRadius: 10,
          padding: 14,
          marginTop: 16,
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setWallpaperCompareOpen(!wallpaperCompareOpen)}
        >
          <SectionTitle accent="#5a6b52">仕入れ比較 - 壁紙(店舗ごとの単価)</SectionTitle>
          <span style={{ fontSize: 16, color: "#5a6b52" }}>{wallpaperCompareOpen ? "▲" : "▼"}</span>
        </div>
        {wallpaperCompareOpen && (
          <>
            <div style={{ fontSize: 12, color: "#5a6b52", marginBottom: 10, lineHeight: 1.6 }}>
              数量は壁紙の総数({lossMode === "perRoom" ? "部屋ごと割増" : "全体一括割増"}・{round1(finalWallpaperM)}m)を使用。単価はm(メートル)あたりで入力。
            </div>
            {wallpaperShops.map((shop, i) =>
              renderMaterialShopCard(
                shop,
                i,
                updateWallpaperShop,
                cheapestWallpaperPrice,
                finalWallpaperM,
                "#4c6b40",
                adoptedWallpaperShopId,
                toggleAdoptWallpaperShop
              )
            )}
          </>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #d8e3cd",
          borderRadius: 10,
          padding: 14,
          marginTop: 16,
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setCfCompareOpen(!cfCompareOpen)}
        >
          <SectionTitle accent="#5a6b52">仕入れ比較 - CF(店舗ごとの単価)</SectionTitle>
          <span style={{ fontSize: 16, color: "#5a6b52" }}>{cfCompareOpen ? "▲" : "▼"}</span>
        </div>
        {cfCompareOpen && (
          <>
            <div style={{ fontSize: 12, color: "#5a6b52", marginBottom: 10, lineHeight: 1.6 }}>
              数量はCFの総数({lossMode === "perRoom" ? "部屋ごと割増" : "全体一括割増"}・{round1(finalCfM)}m)を使用。単価はm(メートル)あたりで入力。
            </div>
            {cfShops.map((shop, i) =>
              renderMaterialShopCard(
                shop,
                i,
                updateCfShop,
                cheapestCfPrice,
                finalCfM,
                "#b8860b",
                adoptedCfShopId,
                toggleAdoptCfShop
              )
            )}
          </>
        )}
      </div>

      {hasOtherSheetRooms && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #d8e3cd",
            borderRadius: 10,
            padding: 14,
            marginTop: 16,
          }}
        >
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setOtherSheetCompareOpen(!otherSheetCompareOpen)}
          >
            <SectionTitle accent="#5a6b52">仕入れ比較 - 別シート(店舗ごとの単価)</SectionTitle>
            <span style={{ fontSize: 16, color: "#5a6b52" }}>{otherSheetCompareOpen ? "▲" : "▼"}</span>
          </div>
          {otherSheetCompareOpen && (
            <>
              <div style={{ fontSize: 12, color: "#5a6b52", marginBottom: 10, lineHeight: 1.6 }}>
                数量は別シートの総数({lossMode === "perRoom" ? "部屋ごと割増" : "全体一括割増"}・{round1(finalOtherSheetM)}m)を使用。単価はm(メートル)あたりで入力。
              </div>
              {otherSheetShops.map((shop, i) =>
                renderMaterialShopCard(
                  shop,
                  i,
                  updateOtherSheetShop,
                  cheapestOtherSheetPrice,
                  finalOtherSheetM,
                  "#6b4c8a",
                  adoptedOtherSheetShopId,
                  toggleAdoptOtherSheetShop
                )
              )}
            </>
          )}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #d8e3cd",
          borderRadius: 10,
          padding: 14,
          marginTop: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setFavoritesOpen(!favoritesOpen)}
        >
          <SectionTitle accent="#5a6b52">よく使うショップ(お気に入りURL)</SectionTitle>
          <span style={{ fontSize: 16, color: "#5a6b52" }}>{favoritesOpen ? "▲" : "▼"}</span>
        </div>
        {favoritesOpen && (
          <>
            <div style={{ fontSize: 12, color: "#5a6b52", marginBottom: 8, lineHeight: 1.6 }}>
              この端末に保存されます。上の仕入れ比較でボタン一つでURLを差し込めます。
            </div>
            {favoriteShops.map((f) => (
              <div key={f.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: "1 1 0%",
                    minWidth: 0,
                    fontSize: 13,
                    color: "#33502e",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </a>
                <button
                  onClick={() => removeFavorite(f.id)}
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
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
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input
                value={newFavName}
                onChange={(e) => setNewFavName(e.target.value)}
                placeholder="ショップ名"
                style={{
                  flex: "1 1 0%",
                  minWidth: 0,
                  padding: "7px 8px",
                  fontSize: 13,
                  border: "1px solid #cbd5c0",
                  borderRadius: 5,
                }}
              />
              <input
                value={newFavUrl}
                onChange={(e) => setNewFavUrl(e.target.value)}
                placeholder="URL"
                style={{
                  flex: "2 1 0%",
                  minWidth: 0,
                  padding: "7px 8px",
                  fontSize: 13,
                  border: "1px solid #cbd5c0",
                  borderRadius: 5,
                }}
              />
              <button
                onClick={addFavorite}
                style={{
                  padding: "7px 12px",
                  borderRadius: 5,
                  border: "1px solid #4c6b40",
                  background: "#4c6b40",
                  color: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                追加
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
