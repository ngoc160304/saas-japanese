import type { ClientCoursesQuery } from '@/apis/courses/client-courses.type';

export const DEFAULT_COURSES_PAGE = 1;
export const DEFAULT_COURSES_SIZE = 9;
export const MAX_COURSES_SIZE = 12;
export const DEFAULT_COURSES_SORT = 'newest';

export type CoursesPricing = 'all' | 'free' | 'paid';
export type CoursesSort = 'newest' | 'price-asc' | 'price-desc';

export interface CoursesUrlState {
  title: string;
  categoryId: number | null;
  pricing: CoursesPricing;
  page: number;
  size: number;
  sort: CoursesSort;
}

const managedParams = ['title', 'categoryId', 'pricing', 'page', 'size', 'sort'] as const;

function parsePositiveInteger(value: string | null, fallback: number, maximum?: number) {
  if (value === null || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    return fallback;
  }
  return parsed;
}

export function parseCoursesSearchParams(params: Pick<URLSearchParams, 'get'>): CoursesUrlState {
  const pricingValue = params.get('pricing');
  const pricing: CoursesPricing =
    pricingValue === 'free' || pricingValue === 'paid' ? pricingValue : 'all';
  const sortValue = params.get('sort');
  const sort: CoursesSort =
    sortValue === 'price-asc' || sortValue === 'price-desc' ? sortValue : DEFAULT_COURSES_SORT;
  const categoryId = parsePositiveInteger(params.get('categoryId'), 0);

  return {
    title: (params.get('title') ?? '').trim(),
    categoryId: categoryId || null,
    pricing,
    page: parsePositiveInteger(params.get('page'), DEFAULT_COURSES_PAGE),
    size: parsePositiveInteger(params.get('size'), DEFAULT_COURSES_SIZE, MAX_COURSES_SIZE),
    sort,
  };
}

export function toClientCoursesQuery(state: CoursesUrlState): ClientCoursesQuery {
  const sort: Pick<ClientCoursesQuery, 'sortKey' | 'sortType'> =
    state.sort === 'price-asc'
      ? { sortKey: 'price', sortType: 'ASC' }
      : state.sort === 'price-desc'
        ? { sortKey: 'price', sortType: 'DESC' }
        : { sortKey: 'createdAt', sortType: 'DESC' };

  return {
    page: state.page - 1,
    size: state.size,
    ...(state.title ? { title: state.title } : {}),
    ...(state.categoryId ? { categoryId: state.categoryId } : {}),
    ...(state.pricing === 'all' ? {} : { pricing: state.pricing }),
    ...sort,
  };
}

export function writeCoursesSearchParams(current: URLSearchParams, state: CoursesUrlState) {
  const params = new URLSearchParams(current);
  managedParams.forEach((name) => params.delete(name));

  if (state.title) params.set('title', state.title.trim());
  if (state.categoryId) params.set('categoryId', String(state.categoryId));
  if (state.pricing !== 'all') params.set('pricing', state.pricing);
  if (state.page !== DEFAULT_COURSES_PAGE) params.set('page', String(state.page));
  if (state.size !== DEFAULT_COURSES_SIZE) params.set('size', String(state.size));
  if (state.sort !== DEFAULT_COURSES_SORT) params.set('sort', state.sort);

  return params;
}

export type PaginationItem = number | 'ellipsis';

export function getCoursesPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  if (page >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages];
}
