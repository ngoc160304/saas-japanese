import axios from 'axios';
import authorizeAxiosIntance from '@/lib/authorize-axios';
import { API_VERSION } from '@/utils/constant';
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/${API_VERSION}`;
console.log(API_URL);
const getCategoriesCourse = async () => {
  try {
    const response = await authorizeAxiosIntance.get(`${API_URL}/course-categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories course:', error);
    throw error;
  }
};
export const categoryCourseAPI = {
  getCategoriesCourse,
};
