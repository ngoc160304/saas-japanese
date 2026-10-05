import type { MyCoursesQuery } from '@/apis/courses/client-courses.api';

export const MY_COURSES_PAGE_SIZE = 9;

export interface MyCoursesUrlState {
  courseTitle: string;
  page: number;
}

export function parseMyCoursesSearchParams(params: Pick<URLSearchParams, 'get'>): MyCoursesUrlState {
  const value = params.get('page');
  const page = value && /^\d+$/.test(value) ? Number(value) : 1;
  return {
    courseTitle: (params.get('courseTitle') ?? '').trim(),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function writeMyCoursesSearchParams(current: URLSearchParams, state: MyCoursesUrlState) {
  const params = new URLSearchParams(current);
  for (const name of ['courseTitle', 'page', 'title', 'categoryId', 'pricing', 'sort', 'size']) {
    params.delete(name);
  }
  if (state.courseTitle) params.set('courseTitle', state.courseTitle.trim());
  if (state.page > 1) params.set('page', String(state.page));
  return params;
}

export function toMyCoursesQuery(state: MyCoursesUrlState): MyCoursesQuery {
  return {
    page: state.page - 1,
    size: MY_COURSES_PAGE_SIZE,
    ...(state.courseTitle ? { courseTitle: state.courseTitle } : {}),
  };
}
