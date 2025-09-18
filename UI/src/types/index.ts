// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Student extends User {
  studentId: string;
  class: string;
  academicYear: number;
  enrollments: Enrollment[];
}

// Course & Section Types
export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  description?: string;
}

export interface CourseSection {
  id: string;
  subjectId: string;
  subject: Subject;
  sectionNumber: string;
  termId: string;
  term: Term;
  maxEnrollment: number;
  currentEnrollment: number;
  schedule: Schedule[];
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseSectionId: string;
  courseSection: CourseSection;
  enrollmentDate: string;
  status: 'enrolled' | 'completed' | 'dropped';
  grade?: number;
}

// Assignment & Document Types
export interface Assignment {
  id: string;
  courseSectionId: string;
  title: string;
  description: string;
  type: 'programming' | 'quiz' | 'essay';
  dueDate: string;
  maxScore: number;
  attachments: string[];
  isSubmitted: boolean;
  submission?: Submission;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments: string[];
  submittedAt: string;
  score?: number;
  feedback?: string;
}

export interface Document {
  id: string;
  courseSectionId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  category: 'lecture' | 'slide' | 'reference' | 'other';
}

// Forum Types
export interface ForumPost {
  id: string;
  courseSectionId: string;
  authorId: string;
  author: User;
  title: string;
  content: string;
  createdAt: string;
  upvotes: number;
  isUpvoted: boolean;
  replies: ForumReply[];
}

export interface ForumReply {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
  upvotes: number;
  isUpvoted: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'grade' | 'announcement' | 'forum';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}