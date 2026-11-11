import { pickGlanceItems, type GlanceInputs } from "../lib/glance";
import type { FetchState } from "../useFetch";
import { StatTile, StatusBadge } from "./ui";

type Props = { [Key in keyof GlanceInputs]-?: FetchState<NonNullable<GlanceInputs[Key]>> };

// The four most urgent items by the rules in lib/glance.ts.
export function GlanceStrip(props: Props) {
  const inputs = Object.fromEntries(Object.entries(props).map(([key, state]) => [key, state.data])) as GlanceInputs;
  const items = pickGlanceItems(inputs);

  if (!items.length) return <p className="muted">Loading...</p>;
  return (
    <section className="glance" aria-label="Most urgent items">
      {items.map((item) => (
        <StatTile
          key={item.id}
          label={item.label}
          value={item.value}
          detail={<>{item.detail} {item.badge && <StatusBadge {...item.badge} />}</>}
        />
      ))}
    </section>
  );
}
