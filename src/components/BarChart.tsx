import { useState } from "react";
import type { Point } from "../lib/economy";

const width = 320;
const height = 64;
const inset = 4;

// A single-series bar chart from a zero baseline, so negative values hang below it. Hovering a bar moves the readout.
export function BarChart({ title, points, format, label }: { title: string; points: Point[]; format: (value: number) => string; label: (date: string) => string }) {
  const [hovered, setHovered] = useState<number>();
  if (!points.length) return null;

  const values = points.map((point) => point.value);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const y = (value: number) => inset + ((max - value) / (max - min || 1)) * (height - 2 * inset);
  const zero = y(0);
  const slot = width / points.length;
  const activeIndex = hovered ?? points.length - 1;
  const active = points[activeIndex];

  return (
    <figure className="sparkline bar-chart">
      <figcaption>
        <span>{title}</span>
        <span>
          <strong>{format(active.value)}</strong> <span className="muted">{label(active.date)}</span>
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}: ${points.map((point) => `${label(point.date)} ${format(point.value)}`).join(", ")}`}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setHovered(Math.min(points.length - 1, Math.max(0, Math.floor(((event.clientX - box.left) / box.width) * points.length))));
        }}
        onPointerLeave={() => setHovered(undefined)}
      >
        {points.map((point, index) => (
          <rect
            key={point.date}
            className={hovered === undefined || hovered === index ? "" : "dimmed"}
            x={index * slot + 2}
            width={slot - 4}
            y={Math.min(y(point.value), zero)}
            height={Math.max(1, Math.abs(y(point.value) - zero))}
            rx={2}
          />
        ))}
        <line className="baseline" x1={0} x2={width} y1={zero} y2={zero} />
      </svg>
      <div className="range muted">
        <span>{label(points[0].date)}</span>
        <span>Low {format(Math.min(...values))}, high {format(Math.max(...values))}</span>
      </div>
    </figure>
  );
}
