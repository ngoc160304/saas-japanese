import type { AdminJlptExamQuery } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';

export type AdminJlptListParams = AdminJlptExamQuery &
  Required<Pick<AdminJlptExamQuery, 'page' | 'size' | 'sortKey' | 'sortType'>>;

export function parseAdminJlptExamId(value: string): number | null {
  const id = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null;
}

function pageNumber(value: string | null, fallback: number, maximum: number) {
  const number = value === null ? fallback : Number(value);
  return value !== '' &&
    (value === null || /^\d+$/.test(value)) &&
    Number.isSafeInteger(number) &&
    number >= 1 &&
    number <= maximum
    ? number
    : fallback;
}

/** URL pages are one based; backend page and all hierarchy sortOrder values are zero based. */
export function parseAdminJlptExamQuery(params: Pick<URLSearchParams, 'get'>): AdminJlptListParams {
  const level = params.get('level');
  const status = params.get('status');
  const sortKey = params.get('sortKey');
  const search = params.get('search')?.trim();
  return {
    page: pageNumber(params.get('page'), 1, 2_147_483_647) - 1,
    size: pageNumber(params.get('size'), 10, 12),
    ...(search ? { search } : {}),
    ...(level === 'N1' || level === 'N2' || level === 'N3' || level === 'N4' || level === 'N5'
      ? { level }
      : {}),
    ...(status === 'DRAFT' || status === 'PUBLISHED' || status === 'ARCHIVED' ? { status } : {}),
    sortKey:
      sortKey === 'id' ||
      sortKey === 'title' ||
      sortKey === 'level' ||
      sortKey === 'totalTimeMinutes' ||
      sortKey === 'status' ||
      sortKey === 'createdAt'
        ? sortKey
        : 'updatedAt',
    sortType: params.get('sortType')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
  };
}

/** Preserve unrelated query state. API page is converted to a one-based URL here. */
export function writeAdminJlptExamQuery(params: URLSearchParams, state: AdminJlptListParams) {
  const next = new URLSearchParams(params);
  for (const key of ['search', 'level', 'status', 'page', 'size', 'sortKey', 'sortType'])
    next.delete(key);
  if (state.search?.trim()) next.set('search', state.search.trim());
  if (state.level) next.set('level', state.level);
  if (state.status) next.set('status', state.status);
  if (state.page > 0) next.set('page', String(state.page + 1));
  if (state.size !== 10) next.set('size', String(state.size));
  if (state.sortKey !== 'updatedAt') next.set('sortKey', state.sortKey);
  if (state.sortType !== 'DESC') next.set('sortType', state.sortType);
  return next;
}
