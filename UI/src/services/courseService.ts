import api from '../utils/api';
import { CourseSection, Enrollment, ApiResponse, PaginatedResponse } from '../types';

export const courseService = {
  getEnrolledCourses: async (): Promise<ApiResponse<Enrollment[]>> => {
    const response = await api.get('/sections-enrollments/my-courses');
    return response.data;
  },

  getCourseDetail: async (courseSectionId: string): Promise<ApiResponse<CourseSection>> => {
    const response = await api.get(`/course-sections/${courseSectionId}`);
    return response.data;
  },

  enrollCourse: async (courseSectionId: string): Promise<ApiResponse<Enrollment>> => {
    const response = await api.post('/sections-enrollments', { courseSectionId });
    return response.data;
  },

  dropCourse: async (enrollmentId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/sections-enrollments/${enrollmentId}`);
    return response.data;
  },

  searchCourses: async (query: string): Promise<ApiResponse<PaginatedResponse<CourseSection>>> => {
    const response = await api.get(`/course-sections/search?q=${query}`);
    return response.data;
  },
};