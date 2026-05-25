// Chart components: TimeSeriesChart, PSDChart, TopoplotImage
// Colors come from CSS variables so themes can override without re-rendering.

const CC = (name, fallback) =>
  `var(${name}${fallback ? `, ${fallback}` : ""})`;

const CHART_COLORS = {
  C3:      CC("--chart-c3", "#e2d9ff"),
  C4:      CC("--chart-c4", "#c4b5fd"),
  Cz:      CC("--chart-cz", "#7c6fff"),
  axis:    CC("--chart-axis", "#334155"),
  axisLabel: CC("--chart-axis-label", "#64748b"),
  gridLine: CC("--chart-grid", "#1e1a30"),
  muBand:  CC("--chart-mu-band", "rgba(167, 139, 250, 0.10)"),
  betaBand: CC("--chart-beta-band", "rgba(124, 111, 255, 0.10)"),
  cueLine: CC("--chart-cue", "#a78bfa"),
  zero:    CC("--chart-zero", "#2a2640"),
  glow:    CC("--chart-glow", "none"),
  // PSD-specific
  psdLine: CC("--chart-psd-line", "#c4b5fd"),
  psdFill: CC("--chart-psd-fill", "#c4b5fd"),
};

// --- shared helpers ---------------------------------------------------------
function ticks(min, max, count) {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => +(min + step * i).toFixed(2));
}

// ==========================================================================
// TimeSeriesChart
// ==========================================================================
function TimeSeriesChart({ data, height = 280 }) {
  const wrapRef = React.useRef(null);
  const [width, setWidth] = React.useState(800);
  const [hover, setHover] = React.useState(null); // { x, t, vals }

  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  if (!data) return null;
  const { times, channels } = data;

  const M = { top: 18, right: 18, bottom: 36, left: 56 };
  const W = Math.max(320, width);
  const H = height;
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;

  const xMin = times[0], xMax = times[times.length - 1];
  const all = [...channels.C3, ...channels.C4, ...channels.Cz];
  const yMaxAbs = Math.max(...all.map(Math.abs)) * 1.05;
  const yMin = -yMaxAbs, yMax = yMaxAbs;

  const xScale = (t) => M.left + ((t - xMin) / (xMax - xMin)) * innerW;
  const yScale = (v) => M.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  function pathFor(values) {
    let d = "";
    for (let i = 0; i < values.length; i++) {
      const x = xScale(times[i]).toFixed(2);
      const y = yScale(values[i]).toFixed(2);
      d += (i === 0 ? "M" : "L") + x + " " + y + " ";
    }
    return d;
  }

  const xTicks = ticks(xMin, xMax, 6);
  const yTicks = ticks(yMin, yMax, 5);

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < M.left || px > M.left + innerW) { setHover(null); return; }
    const t = xMin + ((px - M.left) / innerW) * (xMax - xMin);
    // find nearest index
    let lo = 0, hi = times.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (times[mid] < t) lo = mid; else hi = mid;
    }
    const idx = Math.abs(times[lo] - t) < Math.abs(times[hi] - t) ? lo : hi;
    setHover({ idx, t: times[idx], C3: channels.C3[idx], C4: channels.C4[idx], Cz: channels.Cz[idx] });
  }

  // Band shading: mu ~ 8-13 Hz isn't a time region, but per spec the bands shade
  // a physiologically interesting time window. Shade ERD window 0.5s–1.5s with mu tone,
  // and beta rebound window 1.5s–2.0s.
  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      <svg
        width={W} height={H}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block" }}
      >
        {/* Band shading */}
        <rect x={xScale(0.5)} y={M.top} width={xScale(1.5) - xScale(0.5)} height={innerH} fill={CHART_COLORS.muBand} />
        <rect x={xScale(1.5)} y={M.top} width={xScale(2.0) - xScale(1.5)} height={innerH} fill={CHART_COLORS.betaBand} />

        {/* Grid */}
        {yTicks.map((v, i) => (
          <line key={"yg" + i} x1={M.left} x2={M.left + innerW} y1={yScale(v)} y2={yScale(v)}
            stroke={CHART_COLORS.gridLine} strokeWidth="1" />
        ))}
        {xTicks.map((t, i) => (
          <line key={"xg" + i} x1={xScale(t)} x2={xScale(t)} y1={M.top} y2={M.top + innerH}
            stroke={CHART_COLORS.gridLine} strokeWidth="1" />
        ))}

        {/* Zero line (baseline) */}
        <line x1={M.left} x2={M.left + innerW} y1={yScale(0)} y2={yScale(0)}
          stroke={CHART_COLORS.zero} strokeWidth="1" strokeDasharray="3 3" />

        {/* Cue line at t=0 */}
        <line x1={xScale(0)} x2={xScale(0)} y1={M.top} y2={M.top + innerH}
          stroke={CHART_COLORS.cueLine} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7" />
        <text x={xScale(0) + 5} y={M.top + 12} fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.cueLine}>cue</text>

        {/* Axes */}
        <line x1={M.left} x2={M.left + innerW} y1={M.top + innerH} y2={M.top + innerH} stroke={CHART_COLORS.axis} />
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + innerH} stroke={CHART_COLORS.axis} />

        {/* Y axis ticks + labels */}
        {yTicks.map((v, i) => (
          <g key={"yt" + i}>
            <line x1={M.left - 4} x2={M.left} y1={yScale(v)} y2={yScale(v)} stroke={CHART_COLORS.axis} />
            <text x={M.left - 8} y={yScale(v) + 3} textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.axisLabel}>
              {v.toFixed(0)}
            </text>
          </g>
        ))}
        <text x={14} y={M.top + innerH / 2} fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.axisLabel}
          transform={`rotate(-90, 14, ${M.top + innerH / 2})`} textAnchor="middle">μV</text>

        {/* X axis ticks + labels */}
        {xTicks.map((t, i) => (
          <g key={"xt" + i}>
            <line x1={xScale(t)} x2={xScale(t)} y1={M.top + innerH} y2={M.top + innerH + 4} stroke={CHART_COLORS.axis} />
            <text x={xScale(t)} y={M.top + innerH + 16} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.axisLabel}>
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={M.left + innerW / 2} y={M.top + innerH + 30} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.axisLabel}>
          time (s)
        </text>

        {/* Signal traces */}
        <path d={pathFor(channels.C3)} fill="none" stroke={CHART_COLORS.C3} strokeWidth="1.4" opacity="0.9" style={{ filter: CHART_COLORS.glow }} />
        <path d={pathFor(channels.C4)} fill="none" stroke={CHART_COLORS.C4} strokeWidth="1.4" opacity="0.95" style={{ filter: CHART_COLORS.glow }} />
        <path d={pathFor(channels.Cz)} fill="none" stroke={CHART_COLORS.Cz} strokeWidth="1.6" style={{ filter: CHART_COLORS.glow }} />

        {/* Hover crosshair */}
        {hover && (
          <g>
            <line x1={xScale(hover.t)} x2={xScale(hover.t)} y1={M.top} y2={M.top + innerH}
              stroke={CHART_COLORS.cueLine} strokeWidth="1" opacity="0.5" />
            <circle cx={xScale(hover.t)} cy={yScale(hover.C3)} r="3" fill={CHART_COLORS.C3} />
            <circle cx={xScale(hover.t)} cy={yScale(hover.C4)} r="3" fill={CHART_COLORS.C4} />
            <circle cx={xScale(hover.t)} cy={yScale(hover.Cz)} r="3" fill={CHART_COLORS.Cz} />
          </g>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, padding: "10px 0 0 56px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)" }}>
        {["C3", "C4", "Cz"].map(ch => (
          <div key={ch} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 2.5, background: CHART_COLORS[ch], display: "inline-block" }} />
            <span>{ch}</span>
            {hover && (
              <span style={{ color: "var(--text)", marginLeft: 4 }}>
                {hover[ch] >= 0 ? "+" : ""}{hover[ch].toFixed(2)}μV
              </span>
            )}
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: CHART_COLORS.muBand, marginRight: 4, verticalAlign: "middle" }} />ERD window</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: CHART_COLORS.betaBand, marginRight: 4, verticalAlign: "middle" }} />β rebound</span>
          {hover && <span style={{ color: "var(--text)" }}>t = {hover.t.toFixed(3)}s</span>}
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// PSDChart
// ==========================================================================
function PSDChart({ data, height = 240 }) {
  const wrapRef = React.useRef(null);
  const [width, setWidth] = React.useState(600);
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  if (!data) return null;

  const { freqs, power, channel } = data;
  const M = { top: 16, right: 16, bottom: 36, left: 48 };
  const W = Math.max(280, width);
  const H = height;
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;

  const xMin = freqs[0], xMax = freqs[freqs.length - 1];
  const yMin = Math.min(...power) - 1;
  const yMax = Math.max(...power) + 1;

  const xScale = (f) => M.left + ((f - xMin) / (xMax - xMin)) * innerW;
  const yScale = (p) => M.top + (1 - (p - yMin) / (yMax - yMin)) * innerH;

  let d = "";
  for (let i = 0; i < freqs.length; i++) {
    d += (i === 0 ? "M" : "L") + xScale(freqs[i]).toFixed(2) + " " + yScale(power[i]).toFixed(2) + " ";
  }
  const fillPath = d + `L ${xScale(xMax)} ${yScale(yMin)} L ${xScale(xMin)} ${yScale(yMin)} Z`;

  const xTicks = [1, 5, 10, 15, 20, 25, 30, 35, 40];
  const yTicks = ticks(yMin, yMax, 5);

  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      <svg width={W} height={H} style={{ display: "block" }}>
        {/* Band shading: mu 8-13, beta 13-30 */}
        <rect x={xScale(8)} y={M.top} width={xScale(13) - xScale(8)} height={innerH} fill={CHART_COLORS.muBand} />
        <rect x={xScale(13)} y={M.top} width={xScale(30) - xScale(13)} height={innerH} fill={CHART_COLORS.betaBand} />

        {/* Grid */}
        {yTicks.map((v, i) => (
          <line key={i} x1={M.left} x2={M.left + innerW} y1={yScale(v)} y2={yScale(v)} stroke={CHART_COLORS.gridLine} />
        ))}

        {/* Axes */}
        <line x1={M.left} x2={M.left + innerW} y1={M.top + innerH} y2={M.top + innerH} stroke={CHART_COLORS.axis} />
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + innerH} stroke={CHART_COLORS.axis} />

        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={M.left - 4} x2={M.left} y1={yScale(v)} y2={yScale(v)} stroke={CHART_COLORS.axis} />
            <text x={M.left - 8} y={yScale(v) + 3} textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.axisLabel}>
              {v.toFixed(0)}
            </text>
          </g>
        ))}
        <text x={12} y={M.top + innerH / 2} fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.axisLabel}
          transform={`rotate(-90, 12, ${M.top + innerH / 2})`} textAnchor="middle">dB</text>

        {xTicks.map((t, i) => (
          <g key={i}>
            <line x1={xScale(t)} x2={xScale(t)} y1={M.top + innerH} y2={M.top + innerH + 4} stroke={CHART_COLORS.axis} />
            <text x={xScale(t)} y={M.top + innerH + 16} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.axisLabel}>
              {t}
            </text>
          </g>
        ))}
        <text x={M.left + innerW / 2} y={M.top + innerH + 30} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.axisLabel}>
          frequency (Hz)
        </text>

        {/* Band labels */}
        <text x={(xScale(8) + xScale(13)) / 2} y={M.top + 12} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.cueLine}>μ</text>
        <text x={(xScale(13) + xScale(30)) / 2} y={M.top + 12} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={CHART_COLORS.Cz}>β</text>

        {/* PSD curve + fill */}
        <path d={fillPath} fill={CHART_COLORS.psdFill} opacity="0.10" />
        <path d={d} fill="none" stroke={CHART_COLORS.psdLine} strokeWidth="1.6" style={{ filter: CHART_COLORS.glow }} />
      </svg>

      <div style={{ display: "flex", gap: 14, padding: "8px 0 0 48px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)" }}>
        <span>channel = <span style={{ color: "var(--text)" }}>{channel}</span></span>
        <span>method = welch</span>
        <span>window = 1.0s · hann</span>
      </div>
    </div>
  );
}

// ==========================================================================
// TopoplotImage
// ==========================================================================
function TopoplotImage({ data, height = 280 }) {
  if (!data) return null;
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height }}>
      <div style={{ width: height, height, maxWidth: "100%" }} dangerouslySetInnerHTML={{ __html: data.svg }} />
    </div>
  );
}

Object.assign(window, { TimeSeriesChart, PSDChart, TopoplotImage });
