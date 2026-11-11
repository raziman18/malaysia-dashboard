import { fetchFuelPrice, fetchInflation, fetchUnemployment, type fetchExchangeRates } from "../api";
import type { Point } from "../lib/economy";
import { dayLabel, monthLabel, ringgit } from "../lib/format";
import { useFetch, type FetchState } from "../useFetch";
import { Sparkline } from "./Sparkline";
import { Async, Panel, StatTile } from "./ui";

type Rates = Awaited<ReturnType<typeof fetchExchangeRates>>;

export function EconomyPanel({ rates, klci }: { rates: FetchState<Rates>; klci: FetchState<Point[]> }) {
  const fuel = useFetch(fetchFuelPrice);
  const inflation = useFetch(fetchInflation);
  const unemployment = useFetch(fetchUnemployment);

  return (
    <Panel title="Economy" sources="Bank Negara Malaysia, data.gov.my (DOSM, Ministry of Finance), Yahoo Finance (unofficial)">
      <div className="tiles">
        <Async state={rates}>
          {(list) => list.map((rate) => (
            <StatTile key={rate.code} label={`1 ${rate.code}`} value={ringgit(rate.ringgit, 4)} detail={`BNM middle rate, ${dayLabel(rate.date)}`} />
          ))}
        </Async>
        <Async state={fuel}>
          {(price) => (
            <>
              <StatTile label="RON95 (BUDI95)" value={ringgit(price.ron95_budi95)} detail={`Unsubsidised ${ringgit(price.ron95)}, week of ${dayLabel(price.date)}`} />
              <StatTile label="Diesel, Peninsular" value={ringgit(price.diesel)} detail={`East Malaysia ${ringgit(price.diesel_eastmsia)}`} />
            </>
          )}
        </Async>
        <Async state={inflation}>
          {(cpi) => <StatTile label="Inflation, year on year" value={cpi.yearOnYear === undefined ? "n/a" : `${cpi.yearOnYear.toFixed(1)}%`} detail={monthLabel(cpi.date)} />}
        </Async>
        <Async state={unemployment}>
          {(labour) => <StatTile label="Unemployment rate" value={`${labour.u_rate}%`} detail={monthLabel(labour.date)} />}
        </Async>
      </div>
      <Async state={klci}>{(points) => <Sparkline title="FBM KLCI, last month" points={points} format={(value) => value.toFixed(2)} />}</Async>
    </Panel>
  );
}
