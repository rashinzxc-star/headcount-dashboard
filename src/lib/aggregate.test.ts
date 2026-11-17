// Design Ref: §8.2 Unit Test Cases — 실제 엑셀로 검증
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { utils, write } from 'xlsx';
import { bonbuNames, byBonbu, filterByBonbu, gradeTotals, summarize } from './aggregate';
import { ParseError, parseWorkbook } from './parseWorkbook';

const file = readFileSync(resolve(__dirname, '../../public/인원현황.xlsx'));
const buf = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
const { rows, excluded } = parseWorkbook(buf);

describe('parseWorkbook', () => {
  it('#1 폐지조직 제외 후 49행, 본부 15개', () => {
    expect(rows).toHaveLength(49);
    expect(excluded).toHaveLength(1);
    expect(excluded[0].teamName).toBe('에너지부문');
    expect(new Set(rows.map((r) => r.bonbuName)).size).toBe(15);
  });

  it('#4 부서명 trim', () => {
    expect(rows.some((r) => r.bonbuName === '한양노동조합')).toBe(true);
  });

  it('#6 필수 컬럼 누락 시 ParseError', () => {
    const ws = utils.aoa_to_sheet([
      ['법인코드', '부서명', '책임'],
      [1010, 'X', 1],
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'S');
    const out = write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    try {
      parseWorkbook(out);
      expect.fail('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError);
      expect((e as ParseError).missing).toContain('DS_BOMUN');
      expect((e as ParseError).missing).not.toContain('책임');
    }
  });

  it('손상된 파일이면 ParseError', () => {
    expect(() => parseWorkbook(new Uint8Array([1, 2, 3]).buffer)).toThrow(ParseError);
  });
});

describe('aggregate', () => {
  it('#2 summarize 전체', () => {
    expect(summarize(rows)).toEqual({
      total: 818,
      exec: 34,
      leaders: 62,
      staff: 722,
      bonbuCount: 15,
      teamCount: 35,
    });
  });

  it('#3 gradeTotals = 엑셀 합계 − 폐지조직', () => {
    expect(gradeTotals(rows)).toEqual({
      사장이상: 1, 부사장: 5, 전무: 10, 상무: 11, 상무보: 7,
      '소장/팀장': 62, 책임: 308, 선임: 95, 기타: 319,
    });
  });

  it('#5 filterByBonbu 기술본부', () => {
    expect(summarize(filterByBonbu(rows, '기술본부')).total).toBe(609);
    expect(filterByBonbu(rows, null)).toBe(rows);
  });

  it('#7 byBonbu SORT_BONBU 순, 합계 일치', () => {
    const b = byBonbu(rows);
    expect(b[0].name).toBe('임원실');
    expect(b.map((x) => x.sort)).toEqual([...b.map((x) => x.sort)].sort());
    expect(b.reduce((s, x) => s + x.total, 0)).toBe(818);
    for (const x of b) expect(Object.values(x.groups).reduce((s, n) => s + n, 0)).toBe(x.total);
  });

  it('기술본부는 그 외 / 건축공사팀 / 인프라공사팀 3행으로 분리, 합 609', () => {
    const b = byBonbu(rows);
    const names = b.map((x) => x.name);
    const i = names.indexOf('기술본부 (그 외)');
    expect(names.slice(i, i + 3)).toEqual(['기술본부 (그 외)', '기술본부 · 건축공사팀', '기술본부 · 인프라공사팀']);
    const get = (n: string) => b.find((x) => x.name === n)!.total;
    expect(get('기술본부 · 건축공사팀')).toBe(369);
    expect(get('기술본부 · 인프라공사팀')).toBe(185);
    expect(get('기술본부 (그 외)') + 369 + 185).toBe(609);
    expect(summarize(filterByBonbu(rows, '기술본부 · 건축공사팀')).total).toBe(369);
  });

  it('차트에서 선택 가능한 모든 행 키가 드롭다운 목록에 있다', () => {
    const opts = bonbuNames(rows);
    for (const b of byBonbu(rows)) expect(opts).toContain(b.name);
    expect(opts).toContain('기술본부');
    expect(new Set(opts).size).toBe(opts.length);
  });
});
