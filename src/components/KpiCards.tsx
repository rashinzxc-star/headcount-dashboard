// Design Ref: §5.3 KpiCards — 6개 stat tile
import type { Summary } from '../lib/aggregate';

const pct = (n: number, total: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : '–');

export default function KpiCards({ summary }: { summary: Summary }) {
  const { total } = summary;
  const items = [
    { label: '총인원', value: total, sub: '전체 기준' },
    { label: '임원', value: summary.exec, sub: `전체의 ${pct(summary.exec, total)}` },
    { label: '소장/팀장', value: summary.leaders, sub: `전체의 ${pct(summary.leaders, total)}` },
    { label: '직원', value: summary.staff, sub: `책임·선임·기타 · ${pct(summary.staff, total)}` },
    { label: '본부 수', value: summary.bonbuCount, sub: '폐지조직 제외' },
    { label: '팀 수', value: summary.teamCount, sub: '본부 직속 제외' },
  ];
  return (
    <section className="kpi-grid" aria-label="핵심 지표">
      {items.map((it) => (
        <div className="kpi" key={it.label}>
          <div className="kpi-label">{it.label}</div>
          <div className="kpi-value">{it.value.toLocaleString()}</div>
          <div className="kpi-sub">{it.sub}</div>
        </div>
      ))}
    </section>
  );
}
