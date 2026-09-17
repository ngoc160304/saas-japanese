import authorizeAxiosIntance from '@/lib/authorize-axios';
import { API_VERSION } from '@/utils/constant';
import { GetCoursesResponse, ReqCreateCourseCategory } from './categories-course.type';
import { QueryParams } from '@/types/query';
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/${API_VERSION}`;
console.log(API_URL);
const getCategoriesCourse = async ({ page, size }: QueryParams) => {
  const response = await authorizeAxiosIntance.get<GetCoursesResponse>(
    `${API_URL}/course-categories`,
    {
      params: {
        page: page - 1,
        size,
      },
    },
  );

  return response.data;
};

const create = async (data: ReqCreateCourseCategory) => {
  try {
    const response = await authorizeAxiosIntance.post(`${API_URL}/course-categories`, data);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories course:', error);
    throw error;
  }
};
const update = async (id: string | number, data: ReqCreateCourseCategory) => {
  try {
    const response = await authorizeAxiosIntance.put(`${API_URL}/course-categories/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories course:', error);
    throw error;
  }
};

const deleteByid = async (id: string) => {
  try {
    const response = await authorizeAxiosIntance.delete(`${API_URL}/course-categories/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories course:', error);
    throw error;
  }
};

export const categoryCourseAPI = {
  getCategoriesCourse,
  deleteByid,
  create,
  update,
};
