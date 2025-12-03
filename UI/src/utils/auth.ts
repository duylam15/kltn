import { jwtDecode } from "jwt-decode";
import instance from "./axiosInstance";

interface User {
    id: string;
    email: string;
    role: "student" | "teacher" | "admin";
    name: string;
}

interface AuthResponse {
    success: boolean;
    user?: User;
    token?: string;
}

// Kiểm tra token trong cookie
export const getTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "access_token") {
            return decodeURIComponent(value);
        }
    }
    return null;
};

// Xóa token khỏi cookie
export const removeTokenFromCookie = (): void => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

// Lưu token vào cookie
export const setTokenToCookie = (token: string, expiresInDays = 7): void => {
    const date = new Date();
    date.setTime(date.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `token=${encodeURIComponent(
        token
    )}; ${expires}; path=/; secure; samesite=strict`;
};

// Verify token và lấy thông tin user
export const verifyToken = async (): Promise<AuthResponse> => {
    const token = getTokenFromCookie();

    if (!token) {
        return { success: false };
    }

    try {
        const response = await instance.get(
            "/auth/verify",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (response.data.success) {
            return {
                success: true,
                user: response.data.user,
                token: token,
            };
        } else {
            removeTokenFromCookie();
            return { success: false };
        }
    } catch (error) {
        console.error("Token verification failed:", error);
        removeTokenFromCookie();
        return { success: false };
    }
};

// Đăng xuất
export const logout = (): void => {
    removeTokenFromCookie();
    window.location.href = "/login";
};



interface DecodedToken {
    exp: number;
    role: string;
    [key: string]: any;
}

export const getToken = (): string | null => {
    return (
        document.cookie
            .split("; ")
            .find((row) => row.startsWith("access_token="))
            ?.split("=")[1] || null
    );
};

export const getRefreshToken = (): string | null => {
    return (
        document.cookie
            .split("; ")
            .find((row) => row.startsWith("refresh_token="))
            ?.split("=")[1] || null
    );
};

export const isTokenValid = (token: string): boolean => {
    try {
        const decoded: DecodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
    } catch {
        return false;
    }
};

export const getUserRole = (token: string): string | null => {
    try {
        const decoded: DecodedToken = jwtDecode(token);
        return decoded.role;
    } catch {
        return null;
    }
};

export const clearTokens = (): void => {
    document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
        "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const getRoleBasedRoute = (role: string): string => {
    switch (role?.toLowerCase()) {
        case "student":
            return "/student";
        case "teacher":
            return "/teacher";
        case "admin":
            return "/admin";
        default:
            return "/student";
    }
};