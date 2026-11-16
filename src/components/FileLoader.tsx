// Design Ref: §5.3 FileLoader — 파일 선택 + 드래그&드롭, ArrayBuffer만 전달
import { useEffect, useRef } from 'react';

interface Props {
  onLoad: (buf: ArrayBuffer, filename: string) => void;
  onError: (message: string) => void;
}

export default function FileLoader({ onLoad, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);

  const read = (file: File | undefined) => {
    if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) {
      onError('엑셀 파일(.xlsx, .xls)만 불러올 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result as ArrayBuffer, file.name);
    reader.onerror = () => onError('파일을 읽는 중 오류가 발생했습니다.');
    reader.readAsArrayBuffer(file);
  };

  // 창 전체 어디에 놓아도 업로드
  useEffect(() => {
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      read(e.dataTransfer?.files?.[0]);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  });

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={(e) => {
          read(e.target.files?.[0]);
          e.target.value = ''; // 같은 파일 재선택 허용
        }}
      />
      <button type="button" className="btn" onClick={() => input.current?.click()}>
        엑셀 불러오기
      </button>
    </>
  );
}
