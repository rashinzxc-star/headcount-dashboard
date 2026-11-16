// Design Ref: §2.1 Component Diagram — App이 state를 갖고 집계 결과만 컴포넌트에 전달
import { useCallback, useEffect, useMemo, useState } from 'react';
import BonbuChart from './components/BonbuChart';
import FileLoader from './components/FileLoader';
import GradeChart from './components/GradeChart';
import KpiCards from './components/KpiCards';
import TeamTable from './components/TeamTable';
import { bonbuNames, byBonbu, filterByBonbu, gradeTotals, summarize } from './lib/aggregate';
import { ParseError, parseWorkbook } from './lib/parseWorkbook';
import type { TeamRow } from './lib/types';

const DEFAULT_FILE = '인원현황.xlsx';

export default function App() {
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [excludedCount, setExcludedCount] = useState(0);
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // 파싱 실패 시 기존 데이터를 유지한다 (Design §6)
  const load = useCallback((buf: ArrayBuffer, name: string) => {
    try {
      const res = parseWorkbook(buf);
      setRows(res.rows);
      setExcludedCount(res.excluded.reduce((s, r) => s + r.total, 0));
      setSource(name);
      setSelected(null);
      setError(null);
    } catch (e) {
      setError(e instanceof ParseError ? e.message : '엑셀 파일을 읽을 수 없습니다.');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(encodeURI(`./${DEFAULT_FILE}`))
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      })
      .then((buf) => alive && load(buf, DEFAULT_FILE))
      .catch(() => alive && setError('기본 엑셀을 불러오지 못했습니다. "엑셀 불러오기"로 파일을 선택하세요.'));
    return () => {
      alive = false;
    };
  }, [load]);

  const filtered = useMemo(() => filterByBonbu(rows, selected), [rows, selected]);
  const summary = useMemo(() => summarize(filtered), [filtered]);
  const totals = useMemo(() => gradeTotals(filtered), [filtered]);
  const stats = useMemo(() => byBonbu(rows), [rows]);
  const names = useMemo(() => bonbuNames(rows), [rows]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>인원현황 대시보드</h1>
          <p className="meta">
            {source ? `원본: ${source}` : '원본 없음'}
            {excludedCount > 0 && ` · 폐지조직 ${excludedCount}명 제외`}
          </p>
        </div>
        <div className="controls">
          <label className="select-label">
            본부
            <select value={selected ?? ''} onChange={(e) => setSelected(e.target.value || null)} disabled={!rows.length}>
              <option value="">전체</option>
              {names.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <FileLoader onLoad={load} onError={setError} />
        </div>
      </header>

      {error && (
        <div className="banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="닫기">
            ✕
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card empty-state">{error ? '표시할 데이터가 없습니다.' : '불러오는 중…'}</div>
      ) : (
        <>
          <KpiCards summary={summary} />
          <div className="grid-2">
            <BonbuChart stats={stats} selected={selected} onSelect={setSelected} />
            <GradeChart totals={totals} scope={selected ?? '전체'} />
          </div>
          <TeamTable rows={filtered} />
        </>
      )}
    </div>
  );
}
