// Design Ref: §5.3 GradeChart — 9직급 단일 시리즈(파랑), 인원·비율 라벨
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GRADES, type GradeCounts } from '../lib/types';

export default function GradeChart({ totals, scope }: { totals: GradeCounts; scope: string }) {
  const sum = GRADES.reduce((s, g) => s + totals[g], 0);
  const data = GRADES.map((g) => ({ name: g, value: totals[g], pct: sum ? (totals[g] / sum) * 100 : 0 }));

  return (
    <div className="card">
      <h2>직급별 인원 구성 <small>{scope}</small></h2>
      <ResponsiveContainer width="100%" height={GRADES.length * 34 + 50}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 120, bottom: 4, left: 8 }}>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            interval={0}
            stroke="var(--muted)"
            tick={{ fill: 'var(--text)', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'var(--hover)' }}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            formatter={(v: number, _k: string, p: { payload?: { pct: number } }) => [
              `${v.toLocaleString()}명 (${(p.payload?.pct ?? 0).toFixed(1)}%)`,
              '인원',
            ]}
          />
          <Bar dataKey="value" fill="var(--c1)" radius={[0, 3, 3, 0]}>
            {/* 기본 라벨은 막대 폭에 맞춰 줄바꿈되므로 한 줄 <text>로 직접 그린다 */}
            <LabelList
              dataKey="value"
              content={(p: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: number | string }) => {
                const v = Number(p.value ?? 0);
                const pct = sum ? ((v / sum) * 100).toFixed(1) : '0.0';
                return (
                  <text
                    x={Number(p.x) + Number(p.width) + 6}
                    y={Number(p.y) + Number(p.height) / 2}
                    dy={4}
                    fontSize={12}
                    fill="var(--text)"
                  >
                    {`${v.toLocaleString()} (${pct}%)`}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
