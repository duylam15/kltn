export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

export const ROLE_ROUTES: Record<string, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
};

// Helper để lấy route từ role name
export const getRoleRoute = (roleName?: string): string => {
  if (!roleName) return '/login';
  return ROLE_ROUTES[roleName.toLowerCase()] || '/login';
};

// Helper để check role
export const isRole = (userRole?: string, targetRole?: RoleName): boolean => {
  if (!userRole || !targetRole) return false;
  return userRole.toLowerCase() === targetRole.toLowerCase();
};