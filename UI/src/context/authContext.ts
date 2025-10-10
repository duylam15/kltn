// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

type Permission = { id: number; name: string };

type Role = {
    id: number;
    name: string;
    permissions: Permission[];
};
type Teacher = {
    id: number;
    userId: number;
    teacherCode: string;
    department: string;
    position: string;
    specialization: string;
    user?: User;
};

type Student = {
    id: number;
    userId: number;
    studentCode: string;
    year: number;
    major: string;
    user?: User;
};
export interface User {
    id: number;
    email: string;
    fullName: string;
    studentCode?: string;
    role: Role;
    teacher?: Teacher | null;
    student?: Student | null;
}


interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
    login: (studentCode: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get("http://localhost:4000/api/v1/auths/me", {
                withCredentials: true,
            })
            .then((res) => setUser(res.data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (studentCode: string, password: string) => {
        await axios.post(
            "http://localhost:4000/api/v1/auths/login",
            { studentCode, password },
            { withCredentials: true }
        );
        const res = await axios.get("http://localhost:4000/api/v1/auths/me", {
            withCredentials: true,
        });
        setUser(res.data.user);
    };

    const logout = async () => {
        await axios.post(
            "http://localhost:4000/api/v1/auths/logout",
            {},
            { withCredentials: true }
        );
        setUser(null);
    };

    const hasPermission = (permission: string) =>
        user?.role?.permissions?.some((p) => p.name === permission) ?? false;

    return React.createElement(
        AuthContext.Provider,
        { value: { user, setUser, loading, login, logout, hasPermission } },
        children
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
