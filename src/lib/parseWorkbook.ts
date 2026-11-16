// Design Ref: §4 parseWorkbook — 헤더명 기반 매핑 (Plan FR-01, FR-02)
import { read, utils } from 'xlsx';
import { EXCLUDED_BONBU, GRADES, type GradeCounts, type TeamRow } from './types';

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly missing: string[] = [],
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

const META_COLUMNS = ['법인코드', '부서코드', '부서명', 'SORT_BONBU', 'CD_BOMUN', 'DS_BOMUN', 'SORT_BOMUN'] as const;
export const REQUIRED_COLUMNS: readonly string[] = [...META_COLUMNS, ...GRADES];

const str = (v: unknown) => (v == null ? '' : String(v).trim());
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(str(v));
  return Number.isFinite(n) ? n : 0;
};

export interface ParseResult {
  rows: TeamRow[];
  excluded: TeamRow[];
}

export function parseWorkbook(buf: ArrayBuffer): ParseResult {
  let matrix: unknown[][];
  try {
    const wb = read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) throw new Error('no sheet');
    matrix = utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
  } catch {
    throw new ParseError('엑셀 파일을 읽을 수 없습니다.');
  }

  const headerIdx = matrix.findIndex((r) => r.some((c) => str(c) === '법인코드'));
  if (headerIdx < 0) throw new ParseError('필수 컬럼이 없습니다.', [...REQUIRED_COLUMNS]);

  const header = matrix[headerIdx].map(str);
  const col = new Map(header.map((h, i) => [h, i] as const));
  const missing = REQUIRED_COLUMNS.filter((c) => !col.has(c));
  if (missing.length) throw new ParseError(`필수 컬럼이 없습니다: ${missing.join(', ')}`, missing);

  const get = (r: unknown[], name: string) => r[col.get(name)!];
  const rows: TeamRow[] = [];
  const excluded: TeamRow[] = [];

  for (const r of matrix.slice(headerIdx + 1)) {
    // 데이터 행 = 법인코드가 숫자인 행 (합계 행/빈 행 제외)
    const corp = get(r, '법인코드');
    if (corp == null || str(corp) === '' || !Number.isFinite(Number(corp))) continue;

    const counts = Object.fromEntries(GRADES.map((g) => [g, num(get(r, g))])) as GradeCounts;
    const teamSort = str(get(r, 'SORT_BOMUN'));
    const row: TeamRow = {
      corpCode: num(corp),
      bonbuCode: num(get(r, '부서코드')),
      bonbuName: str(get(r, '부서명')),
      bonbuSort: str(get(r, 'SORT_BONBU')),
      teamCode: num(get(r, 'CD_BOMUN')),
      teamName: str(get(r, 'DS_BOMUN')),
      teamSort,
      isBonbuDirect: !teamSort.includes('-'),
      counts,
      total: GRADES.reduce((s, g) => s + counts[g], 0),
    };
    (EXCLUDED_BONBU.includes(row.bonbuName) ? excluded : rows).push(row);
  }

  if (!rows.length) throw new ParseError('데이터 행이 없습니다.');
  return { rows, excluded };
}
