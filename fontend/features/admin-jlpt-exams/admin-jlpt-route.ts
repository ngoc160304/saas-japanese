import type { AdminJlptExamQuery } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';

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
export function parseAdminJlptExamQuery(params: Pick<URLSearchParams, 'get'>): AdminJlptExamQuery {
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
