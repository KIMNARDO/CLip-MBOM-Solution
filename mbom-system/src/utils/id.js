/**
 * 고유 ID 생성 유틸리티
 * crypto.randomUUID가 있으면 사용, 없으면 Math.random 사용
 */
export function uid() {
  return crypto.randomUUID?.() ?? 'id_' + Math.random().toString(36).slice(2);
}