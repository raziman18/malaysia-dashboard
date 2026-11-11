import { useState } from "react";
import type { Point } from "../lib/economy";

const width = 320;
const height = 64;
const inset = 6;

// A single-series trend line. Hovering moves the readout to the nearest day.
export function Sparkline({ title, points, format }: { title: string; points: Point[]; format: (value: number) => string }) {
  const [hovered, setHovered] = useState<number>();
  if (points.length < 2) return null;

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (index: number) => inset + (index / (points.length - 1)) * (width - 2 * inset);
  const y = (value: number) => height - inset - ((value - min) / (max - min || 1)) * (height - 2 * inset);
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.value)}`).join("");
  const activeIndex = hovered ?? points.length - 1;
  const active = points[activeIndex];

  return (
    <figure className="sparkline">
      <figcaption>
        <span>{title}</span>
        <span>
          <strong>{format(active.value)}</strong> <span className="muted">{active.date}</span>
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}: ${points.length} points from ${format(min)} to ${format(max)}, latest ${format(values.at(-1)!)}`}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - box.left) / box.width;
          setHovered(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
        }}
        onPointerLeave={() => setHovered(undefined)}
      >
        <line className="baseline" x1={inset} x2={width - inset} y1={height - inset} y2={height - inset} />
        <path d={path} />
        {hovered !== undefined && <line className="crosshair" x1={x(activeIndex)} x2={x(activeIndex)} y1={0} y2={height} />}
        <circle cx={x(activeIndex)} cy={y(active.value)} r={4} />
      </svg>
      <div className="range muted">
        <span>{points[0].date}</span>
        <span>Low {format(min)}, high {format(max)}</span>
      </div>
    </figure>
  );
}
