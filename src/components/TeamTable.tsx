// Design Ref: §5.3 TeamTable — 검색, 정렬, 본부직속 배지, 합계 행
import { useMemo, useState } from 'react';
import { gradeTotals } from '../lib/aggregate';
import { GRADES, type TeamRow } from '../lib/types';

type SortKey = 'bonbu' | 'team' | 'total' | (typeof GRADES)[number];

export default function TeamTable({ rows }: { rows: TeamRow[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey | null; dir: 1 | -1 }>({ key: null, dir: -1 });

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => r.teamName.toLowerCase().includes(q) || r.bonbuName.toLowerCase().includes(q))
      : [...rows];
    const { key, dir } = sort;
    if (key) {
      const val = (r: TeamRow) =>
        key === 'bonbu' ? r.bonbuName : key === 'team' ? r.teamName : key === 'total' ? r.total : r.counts[key];
      list.sort((a, b) => {
        const x = val(a);
        const y = val(b);
        return (typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)) * dir;
      });
    }
    return list;
  }, [rows, query, sort]);

  const totals = useMemo(() => gradeTotals(shown), [shown]);
  const grand = shown.reduce((s, r) => s + r.total, 0);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === 'bonbu' || key === 'team' ? 1 : -1 }));
  const arrow = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? ' ▲' : ' ▼') : '');
  const aria = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none');

  const Th = ({ k, children, num }: { k: SortKey; children: string; num?: boolean }) => (
    <th className={num ? 'num' : undefined} aria-sort={aria(k)}>
      <button type="button" className="th-btn" onClick={() => toggle(k)}>
        {children}
        {arrow(k)}
      </button>
    </th>
  );

  return (
    <div className="card">
      <div className="table-head">
        <h2>팀 상세 <small>{shown.length}개 조직</small></h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="본부·팀 검색"
          aria-label="본부·팀 검색"
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <Th k="bonbu">본부</Th>
              <Th k="team">팀</Th>
              {GRADES.map((g) => (
                <Th key={g} k={g} num>
                  {g}
                </Th>
              ))}
              <Th k="total" num>
                합계
              </Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={`${r.bonbuCode}-${r.teamCode}-${r.teamSort}`}>
                <td>{r.bonbuName}</td>
                <td>
                  {r.teamName}
                  {r.isBonbuDirect && <span className="badge">본부 직속</span>}
                </td>
                {GRADES.map((g) => (
                  <td key={g} className={`num${r.counts[g] === 0 ? ' zero' : ''}`}>
                    {r.counts[g] || '·'}
                  </td>
                ))}
                <td className="num strong">{r.total}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={GRADES.length + 3} className="empty">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>합계</td>
              {GRADES.map((g) => (
                <td key={g} className="num">
                  {totals[g]}
                </td>
              ))}
              <td className="num strong">{grand}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
