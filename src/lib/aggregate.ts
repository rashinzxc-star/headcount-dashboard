// Design Ref: §4 집계 순수 함수 — 컴포넌트는 계산하지 않는다
import {
  EXEC_GRADES,
  GRADE_GROUPS,
  GRADES,
  GROUP_KEYS,
  STAFF_GRADES,
  type GradeCounts,
  type GroupKey,
  type TeamRow,
} from './types';

/** 본부별 차트에서 별도 행으로 분리해 보여줄 팀 (본부명 → 팀명, ' 담당' 접미사 제외) */
export const SEPARATE_TEAMS: Record<string, readonly string[]> = {
  기술본부: ['건축공사팀', '인프라공사팀'],
};

const baseTeam = (name: string) => name.replace(/\s*담당$/, '');

/** 차트 행/선택 키: 분리 대상 팀은 '본부 · 팀', 같은 본부의 나머지는 '본부 (그 외)' */
export function rowKey(r: TeamRow): string {
  const seps = SEPARATE_TEAMS[r.bonbuName];
  if (!seps) return r.bonbuName;
  return seps.includes(baseTeam(r.teamName)) ? `${r.bonbuName} · ${baseTeam(r.teamName)}` : `${r.bonbuName} (그 외)`;
}

/** 본부명(전체) 또는 rowKey(분리 행) 어느 쪽으로도 필터 */
export function filterByBonbu(rows: TeamRow[], bonbu: string | null): TeamRow[] {
  return bonbu ? rows.filter((r) => r.bonbuName === bonbu || rowKey(r) === bonbu) : rows;
}

export function gradeTotals(rows: TeamRow[]): GradeCounts {
  const out = Object.fromEntries(GRADES.map((g) => [g, 0])) as GradeCounts;
  for (const r of rows) for (const g of GRADES) out[g] += r.counts[g];
  return out;
}

const sumOf = (c: GradeCounts, gs: readonly (keyof GradeCounts)[]) => gs.reduce((s, g) => s + c[g], 0);

export interface Summary {
  total: number;
  exec: number;
  leaders: number;
  staff: number;
  bonbuCount: number;
  teamCount: number;
}

// Plan SC-1: KPI가 원본과 일치
export function summarize(rows: TeamRow[]): Summary {
  const t = gradeTotals(rows);
  return {
    total: sumOf(t, GRADES),
    exec: sumOf(t, EXEC_GRADES),
    leaders: t['소장/팀장'],
    staff: sumOf(t, STAFF_GRADES),
    bonbuCount: new Set(rows.map((r) => r.bonbuName)).size,
    teamCount: rows.filter((r) => !r.isBonbuDirect).length,
  };
}

export interface BonbuStat {
  name: string;
  sort: string;
  groups: Record<GroupKey, number>;
  total: number;
}

export function byBonbu(rows: TeamRow[]): BonbuStat[] {
  const map = new Map<string, TeamRow[]>();
  for (const r of rows) {
    const k = rowKey(r);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()]
    .map(([name, rs]) => {
      const t = gradeTotals(rs);
      const groups = Object.fromEntries(GROUP_KEYS.map((k) => [k, sumOf(t, GRADE_GROUPS[k])])) as Record<GroupKey, number>;
      // 같은 본부 안에서 '그 외' → 분리 팀 순으로 정렬되도록 접미 순번을 붙인다
      const seps = SEPARATE_TEAMS[rs[0].bonbuName];
      const order = !seps ? '' : name.endsWith('(그 외)') ? '0' : String(1 + seps.indexOf(baseTeam(rs[0].teamName)));
      return { name, sort: rs[0].bonbuSort + order, groups, total: sumOf(t, GRADES) };
    })
    .sort((a, b) => a.sort.localeCompare(b.sort));
}

/** 드롭다운용: 본부명 + (분리 팀이 있으면) 그 팀 행 */
export function bonbuNames(rows: TeamRow[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const b of byBonbu(rows)) {
    const bonbu = rows.find((r) => rowKey(r) === b.name)!.bonbuName;
    if (!seen.has(bonbu)) {
      seen.add(bonbu);
      out.push(bonbu);
    }
    if (b.name !== bonbu && !b.name.endsWith('(그 외)')) out.push(b.name);
  }
  return out;
}
