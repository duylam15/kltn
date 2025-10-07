import { useAuth } from "../context/authContext";

export function usePermission() {
    const { user } = useAuth();

    function hasPermission(perm: string) {
        if (!user || !user.role || !user.role.permissions) {
            return false;
        }

        return user.role.permissions.some(
            (p) => p.name.trim().toLowerCase() === perm.trim().toLowerCase()
        );
    }

    return { hasPermission };
}
