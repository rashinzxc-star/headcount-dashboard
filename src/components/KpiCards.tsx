// Design Ref: §5.3 KpiCards — 6개 stat tile
import type { Summary } from '../lib/aggregate';

const pct = (n: number, total: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : '–');

export default function KpiCards({ summary, filtered }: { summary: Summary; filtered: boolean }) {
  const { total } = summary;
  const of = filtered ? '선택 범위의' : '전체의'; // 비율은 현재 표시 범위(필터 적용 후) 기준
  const items = [
    { label: '총인원', value: total, sub: filtered ? '선택 범위 기준' : '전체 기준' },
    { label: '임원', value: summary.exec, sub: `${of} ${pct(summary.exec, total)}` },
    { label: '소장/팀장', value: summary.leaders, sub: `${of} ${pct(summary.leaders, total)}` },
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
