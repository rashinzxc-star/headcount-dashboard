// Design Ref: §5.3 BonbuChart — 직급그룹 누적 막대, 클릭으로 본부 선택
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BonbuStat } from '../lib/aggregate';
import { GROUP_KEYS, type GroupKey } from '../lib/types';

export const GROUP_COLORS: Record<GroupKey, string> = {
  임원: 'var(--c1)',
  '소장/팀장': 'var(--c2)',
  책임: 'var(--c3)',
  선임: 'var(--c4)',
  기타: 'var(--c5)',
};

interface Props {
  stats: BonbuStat[];
  selected: string | null;
  onSelect: (name: string | null) => void;
}

export default function BonbuChart({ stats, selected, onSelect }: Props) {
  const data = stats.map((s) => ({ name: s.name, total: s.total, ...s.groups }));
  const dim = (name: string) => (selected && selected !== name ? 0.3 : 1);
  const toggle = (name?: string | number) => {
    if (name == null) return;
    const n = String(name);
    onSelect(selected === n ? null : n);
  };

  return (
    <div className="card">
      <h2>본부별 인원 <small>직급 그룹 누적 · 행 클릭 시 본부 선택</small></h2>
      <ResponsiveContainer width="100%" height={Math.max(240, data.length * 30 + 70)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
          style={{ cursor: 'pointer' }}
          onClick={(state) => toggle(state?.activeLabel)}
        >
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            interval={0}
            stroke="var(--muted)"
            tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => (
              <text
                x={x}
                y={y}
                dy={4}
                textAnchor="end"
                fontSize={12}
                fill="var(--text)"
                fontWeight={selected === payload.value ? 700 : 400}
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(payload.value)}
              >
                {payload.value}
              </text>
            )}
          />
          <Tooltip
            cursor={{ fill: 'var(--hover)' }}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            formatter={(v: number, k: string) => [`${v.toLocaleString()}명`, k]}
            labelFormatter={(l) => {
              const t = data.find((d) => d.name === l)?.total ?? 0;
              return `${l} (합계 ${t.toLocaleString()}명)`;
            }}
          />
          <Legend wrapperStyle={{ color: 'var(--text)', fontSize: 12 }} />
          {GROUP_KEYS.map((k) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="a"
              fill={GROUP_COLORS[k]}
            >
              {data.map((d) => (
                <Cell key={d.name} fillOpacity={dim(d.name)} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
