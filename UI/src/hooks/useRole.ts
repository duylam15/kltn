import { useAuth } from "../context/authContext";
import { ROLES, isRole } from "../constants/roles";

export const useRole = () => {
    const { user } = useAuth();
    const roleName = user?.role?.name;

    return {
        roleName,
        isStudent: isRole(roleName, ROLES.STUDENT),
        isTeacher: isRole(roleName, ROLES.TEACHER),
        isAdmin: isRole(roleName, ROLES.ADMIN),
        hasRole: (role: string) => isRole(roleName, role as any),
        hasAnyRole: (roles: string[]) =>
            roles.some((role) => isRole(roleName, role as any)),
    };
};
