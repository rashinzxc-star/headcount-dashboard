// Design Ref: §3 Data Model
export const GRADES = [
  '사장이상',
  '부사장',
  '전무',
  '상무',
  '상무보',
  '소장/팀장',
  '책임',
  '선임',
  '기타',
] as const;

export type Grade = (typeof GRADES)[number];
export type GradeCounts = Record<Grade, number>;

export interface TeamRow {
  corpCode: number;
  bonbuCode: number;
  bonbuName: string;
  bonbuSort: string;
  teamCode: number;
  teamName: string;
  teamSort: string;
  /** SORT_BOMUN has no '-' → 본부장 직속 행 */
  isBonbuDirect: boolean;
  counts: GradeCounts;
  total: number;
}

export const EXEC_GRADES: readonly Grade[] = ['사장이상', '부사장', '전무', '상무', '상무보'];
export const STAFF_GRADES: readonly Grade[] = ['책임', '선임', '기타'];

export const GROUP_KEYS = ['임원', '소장/팀장', '책임', '선임', '기타'] as const;
export type GroupKey = (typeof GROUP_KEYS)[number];

export const GRADE_GROUPS: Record<GroupKey, readonly Grade[]> = {
  임원: EXEC_GRADES,
  '소장/팀장': ['소장/팀장'],
  책임: ['책임'],
  선임: ['선임'],
  기타: ['기타'],
};

/** 집계에서 제외할 본부명 (Plan FR-02) */
export const EXCLUDED_BONBU = ['폐지조직'];
