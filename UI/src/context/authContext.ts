// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

type Permission = { id: number; name: string };

type Role = {
    id: number;
    name: string;
    permissions: Permission[];
};

type User = {
    id: number;
    email: string;
    fullName: string;
    studentCode: string;
    role: Role;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get("http://localhost:4000/api/v1/auths/me", {
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.success) {
                    setUser(res.data.user);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const hasPermission = (permission: string) => {
        return (
            user?.role.permissions.some((p) => p.name === permission) ?? false
        );
    };

    return React.createElement(
        AuthContext.Provider,
        { value: { user, loading, hasPermission } },
        children
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
