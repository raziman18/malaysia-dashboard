import { fetchFuelPrice, fetchGdp, fetchInflation, fetchStaplePrices, fetchStateGdp, fetchUnemployment, type fetchExchangeRates } from "../api";
import type { Point } from "../lib/economy";
import { dayLabel, monthLabel, priceChangeLabel, quarterLabel, ringgit, ringgitBillions, ringgitChange, signedPercent } from "../lib/format";
import { useFetch, type FetchState } from "../useFetch";
import { BarChart } from "./BarChart";
import { Sparkline } from "./Sparkline";
import { AiSummary, Async, Panel, StatTile } from "./ui";

type Rates = Awaited<ReturnType<typeof fetchExchangeRates>>;

// The change applies to the price before it, for example "RM 4.87 (-RM 0.25 this week)".
// For example "-RM 0.25 this week, ", or nothing when the change is not published.
const weekly = (change?: number) => (change === undefined ? "" : `${ringgitChange(change)} this week, `);

export function EconomyPanel({ rates, klci, summary }: { rates: FetchState<Rates>; klci: FetchState<Point[]>; summary?: string }) {
  const fuel = useFetch(fetchFuelPrice);
  const inflation = useFetch(fetchInflation);
  const unemployment = useFetch(fetchUnemployment);
  const gdp = useFetch(fetchGdp);
  const stateGdp = useFetch(fetchStateGdp);
  const staples = useFetch(fetchStaplePrices);

  return (
    <Panel title="Economy" sources="Bank Negara Malaysia, data.gov.my (DOSM, Ministry of Finance, KPDN PriceCatcher; real GDP at constant 2015 prices), Yahoo Finance (unofficial)" feeds={[rates, klci, fuel, staples, inflation, unemployment, gdp, stateGdp]}>
      <AiSummary summary={summary} />
      <div className="tiles">
        <Async state={rates}>
          {(list) => list.map((rate) => (
            <StatTile key={rate.code} label={`1 ${rate.code}`} value={ringgit(rate.ringgit, 4)} detail={`BNM middle rate, ${dayLabel(rate.date)}`} />
          ))}
        </Async>
        <Async state={fuel}>
          {(price) => (
            <>
              <StatTile
                label="RON95 (BUDI95)"
                value={ringgit(price.ron95_budi95)}
                detail={`Unsubsidised ${ringgit(price.ron95)}, ${weekly(price.weeklyChange?.ron95)}prices from ${dayLabel(price.date)}`}
              />
              <StatTile label="Diesel, Peninsular" value={ringgit(price.diesel)} detail={`${weekly(price.weeklyChange?.diesel)}East Malaysia ${ringgit(price.diesel_eastmsia)}`} />
            </>
          )}
        </Async>
        <Async state={gdp}>
          {(quarters) => {
            const latest = quarters.at(-1)!;
            return <StatTile label="GDP, real" value={ringgitBillions(latest.ringgitMillions)} detail={`Up ${latest.growth.toFixed(1)}% on a year earlier, ${quarterLabel(latest.date)}`} />;
          }}
        </Async>
        <Async state={inflation}>
          {(cpi) => <StatTile label="Inflation, year on year" value={cpi.yearOnYear === undefined ? "n/a" : `${cpi.yearOnYear.toFixed(1)}%`} detail={monthLabel(cpi.date)} />}
        </Async>
        <Async state={unemployment}>
          {(labour) => <StatTile label="Unemployment rate" value={`${labour.u_rate}%`} detail={monthLabel(labour.date)} />}
        </Async>
      </div>
      <h3>Staple food prices</h3>
      <Async state={staples}>
        {(items) => (
          <>
            <p className="muted">Median price across shops on the latest survey day.</p>
            <ul className="rows">
              {items.map((item) => (
                <li key={item.name}>
                  <span>{item.name}</span>
                  <span className="price">
                    <strong>{ringgit(item.price)}</strong> <span className="muted">{priceChangeLabel(item) || dayLabel(item.date)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Async>
      <Async state={gdp}>
        {(quarters) => (
          <BarChart
            title="Real GDP growth, year on year, by quarter"
            points={quarters.map((quarter) => ({ date: quarter.date, value: quarter.growth }))}
            format={(value) => `${value.toFixed(1)}%`}
            label={quarterLabel}
            describe={(date) => ringgitBillions(quarters.find((quarter) => quarter.date === date)!.ringgitMillions)}
          />
        )}
      </Async>
      <Async state={stateGdp}>
        {({ year, states }) => (
          <>
            <h3>GDP by state, {year}</h3>
            <p className="muted">Share of national GDP, amount, and growth from {Number(year) - 1}.</p>
            <ul className="state-bars">
              {states.map((item) => (
                <li key={item.state}>
                  <span>{item.state === "Supra" ? "Supra (offshore, not in any state)" : item.state}</span>
                  <span className="muted">
                    <strong>{item.share.toFixed(1)}%</strong> {ringgitBillions(item.ringgitMillions)}{" "}
                    <span className="state-growth">{item.growth === undefined ? "n/a" : signedPercent(item.growth)}</span>
                  </span>
                  <span className="state-bar" style={{ width: `${(item.share / states[0].share) * 100}%` }} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Async>
      <Async state={klci}>{(points) => <Sparkline title="FBM KLCI, last month" points={points} format={(value) => value.toFixed(2)} />}</Async>
    </Panel>
  );
}
