// context/AuthContext. tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import instance from "../utils/axiosInstance";

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
    avatarUrl?: string;
    teacher?: Teacher | null;
    student?: Student | null;
}

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
    login: (studentCode: string, password: string) => Promise<User>; // ✅ Trả về User
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // ✅ Load user khi app khởi động
    useEffect(() => {
        instance
            .get("/auths/me")
            .then((res: any) => {
                console.log("✅ User loaded from cookie:", res.data.user);
                setUser(res.data.user);
            })
            .catch((err) => {
                console.log(
                    "⚠️ No valid session:",
                    err.response?.data?.message
                );
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    // ✅ Login và trả về user
    const login = async (
        studentCode: string,
        password: string
    ): Promise<User> => {
        // Gọi login API
        await instance.post("/auths/login", { studentCode, password });

        // Fetch user info
        const res: any = await instance.get("/auths/me");
        const userData = res.data.user;

        console.log("✅ Login successful:", userData);
        setUser(userData);

        return userData; // ✅ Trả về user để component dùng
    };

    // ✅ Logout
    const logout = async () => {
        try {
            await instance.post("/auths/logout");
            console.log("✅ Logged out");
        } catch (err) {
            console.error("❌ Logout error:", err);
        } finally {
            setUser(null);
        }
    };

    // ✅ Check permission
   const hasPermission = (permission: string) => {
       if (!user) return false;

       const perms = user.role?.permissions || [];

       // Nếu có quyền "*" => mở toàn bộ
       if (perms.some((p) => p.name === "*")) {
           return true;
       }

       // Nếu có quyền đúng tên permission
       return perms.some((p) => p.name === permission);
   };

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
