import { activity, formatDate, type Entry } from '@membrant/core';

export function ActivityChart({ entries, count = 7 }: { entries: Entry[]; count?: number }) {
  const days = activity(entries, count);
  const max = Math.max(4, ...days.map((day) => day.count));
  return (
    <div
      className="activity-chart"
      role="img"
      aria-label={days.map((day) => `${formatDate(day.date)}: ${day.count} check-ins`).join('; ')}
    >
      <div className="chart-grid" aria-hidden="true">
        {[max, Math.round(max / 2), 0].map((value, index) => (
          <div key={index}>
            <span>{value}</span>
            <i />
          </div>
        ))}
      </div>
      <div className="chart-bars" aria-hidden="true">
        {days.map((day, index) => (
          <div className="chart-column" key={day.date}>
            <span className="bar-value">{day.count > 0 ? day.count : ''}</span>
            <div
              className={`chart-bar ${index === days.length - 1 ? 'today' : ''}`}
              style={{ height: `${Math.max(day.count ? 8 : 2, (day.count / max) * 130)}px` }}
            />
            <span className={index === days.length - 1 ? 'accent' : ''}>
              {count <= 7
                ? formatDate(day.date, { weekday: 'short' })
                : formatDate(day.date, { day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityHeatmap({ entries }: { entries: Entry[] }) {
  const days = activity(entries, 84);
  return (
    <>
      <div className="heatmap" aria-label="Check-ins over the last 12 weeks">
        {days.map((day) => (
          <span
            key={day.date}
            tabIndex={0}
            className={`heat-cell intensity-${Math.min(3, day.count)}`}
            title={`${formatDate(day.date)}: ${day.count} check-ins`}
            aria-label={`${formatDate(day.date)}: ${day.count} check-ins`}
          />
        ))}
      </div>
      <div className="row between small muted">
        <span>12 weeks ago</span>
        <span className="row">
          Less{' '}
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={`heat-cell intensity-${i}`} />
          ))}{' '}
          More
        </span>
        <span>Today</span>
      </div>
    </>
  );
}
