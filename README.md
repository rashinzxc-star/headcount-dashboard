# 인원현황 대시보드

엑셀(인원현황.xlsx)을 브라우저에서 읽어 본부·직급별 인원 현황을 보여주는 로컬 SPA (React + Vite + TypeScript, SheetJS, Recharts).

## 실행
```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm test         # 단위 테스트
```

## 데이터
내부 인사 데이터 보호를 위해 엑셀 원본은 저장소에 포함하지 않습니다.
- 앱 실행 후 **엑셀 불러오기** 버튼(또는 드래그&드롭)으로 파일을 선택하거나,
- `public/인원현황.xlsx`에 파일을 두면 시작 시 자동으로 불러옵니다.
- `npm test`는 `public/인원현황.xlsx`가 있어야 통과합니다.
