import { fetchParliament, newsOutlets } from "../api";
import { dayLabel } from "../lib/format";
import type { Headline } from "../lib/headlines";
import { malaysiaToday, orderPaperUrl, parliamentSite, sits, sittingOutlook, sittingSummary } from "../lib/parliament";
import { filterByTopic } from "../lib/topics";
import { useFetch, type FetchState } from "../useFetch";
import { AiSummary, Async, HeadlineList, Panel } from "./ui";

const weekdayLabel = (date: string) => new Date(date).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });

export function ParliamentPanel({ news, summary }: { news: FetchState<Headline[]>; summary?: string }) {
  const parliament = useFetch(fetchParliament);
  const today = malaysiaToday();

  return (
    <Panel title="Parliament and Cabinet" sources={`Parliament of Malaysia (parlimen.gov.my), ${newsOutlets}`} feeds={[parliament, news]}>
      <AiSummary summary={summary} />
      <h3>Dewan Rakyat</h3>
      <Async state={parliament}>
        {(house) => {
          const { today: sitting, upcoming } = sittingOutlook(house.sittings, today);
          return (
            <>
              <p>{sittingSummary(house, today)}</p>
              <p>
                {sitting && sits(sitting) ? (
                  <a href={orderPaperUrl(today)} target="_blank" rel="noreferrer">Today's order paper (PDF)</a>
                ) : (
                  <a href={`${parliamentSite}/aum-dewan-rakyat.html?uweb=dr&lang=en`} target="_blank" rel="noreferrer">All order papers</a>
                )}
              </p>
              {upcoming.length > 0 && (
                <ul className="rows">
                  {upcoming.map((sitting) => (
                    <li key={sitting.date}>
                      <span>
                        {sitting.business}
                        {sitting.note && <span className="muted"> ({sitting.note})</span>}
                      </span>
                      <span className="muted sitting-date">{weekdayLabel(sitting.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {house.meeting && <p className="muted">{house.meeting.name}: {dayLabel(house.meeting.start)} to {dayLabel(house.meeting.end)}.</p>}
              <h3>Recent bills</h3>
              <p className="muted">
                As of {dayLabel(house.updated)}.{" "}
                <a href={`${parliamentSite}/bills-dewan-rakyat.html?uweb=dr&lang=en`} target="_blank" rel="noreferrer">All bills</a>
              </p>
              <ul className="rows">
                {house.bills.map((bill) => (
                  <li key={bill.code}>
                    <span>
                      {bill.title}
                      <span className="muted bill-detail">
                        {bill.code}
                        {bill.passed && `, passed ${dayLabel(bill.passed)}`}
                        {!bill.passed && bill.firstReading && `, first reading ${dayLabel(bill.firstReading)}`}
                        {bill.presenter && `, presented by ${bill.presenter}`}
                      </span>
                    </span>
                    <strong className="bill-status">{bill.status}</strong>
                  </li>
                ))}
              </ul>
            </>
          );
        }}
      </Async>
      <h3>Cabinet news</h3>
      <p className="muted">The Cabinet does not publish its meeting dates or decisions as data, so this shows news reports.</p>
      <Async state={news}>{(headlines) => <HeadlineList headlines={filterByTopic(headlines, "cabinet")} limit={5} />}</Async>
    </Panel>
  );
}
