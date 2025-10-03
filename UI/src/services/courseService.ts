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

export type TeacherUser = { id: number; fullName: string; email: string; avatar?: string };
export type SectionInstructor = {
  sectionId: number;
  teacherId: number;
  role: "owner" | "co" | "ta";
  teacher: { id: number; user: TeacherUser };
};



// lấy teacher chính (role = owner) theo sectionId
export async function getOwnerTeacher(sectionId: number) {
  const res = await api.get<{ success: boolean; data: SectionInstructor | null }>(
    `/sections-instructors/section/${sectionId}/teacher`
  );
  return res.data.data; // SectionInstructor | null
}
