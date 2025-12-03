// axiosInstance.ts
import axios from "axios";

const baseUrl = "http://localhost:4000/api/v1";

const instance = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Response interceptor
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        console.log("🔴 API Error:", {
            url: originalRequest?.url,
            status: error.response?.status,
            code: error.response?.data?.code,
            message: error.response?.data?.message,
        });

        // ✅ Kiểm tra nếu là lỗi 401 (BẤT KỲ CODE NÀO)
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== "/auths/refresh_token" && // ✅ Không retry chính refresh endpoint
            originalRequest.url !== "/auths/login" && // ✅ Không retry login
            originalRequest.url !== "/auths/logout" // ✅ Không retry logout
        ) {
            originalRequest._retry = true;

            // Nếu đang refresh, thêm vào queue
            if (isRefreshing) {
                console.log("⏳ Đang refresh, thêm request vào queue...");
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => instance(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;
            console.log("🔄 Bắt đầu refresh token.. .");

            try {
                // ✅ Gọi refresh endpoint
                const refreshRes:any = await instance.post("/auths/refresh_token");

                // ✅ Check response
                if (refreshRes?.success) {
                    console.log("✅ Refresh token thành công!", refreshRes);
                    isRefreshing = false;
                    processQueue(null);

                    // Retry request ban đầu
                    return instance(originalRequest);
                } else {
                    console.error("❌ Refresh response invalid:", refreshRes);
                    throw new Error("Refresh failed: Invalid response");
                }
            } catch (refreshError: any) {
                console.error("❌ Refresh token thất bại:", refreshError);
                isRefreshing = false;
                processQueue(refreshError);

                // Logout nếu refresh thất bại
                await handleLogout();
                return Promise.reject(refreshError);
            }
        }

        // Các lỗi khác (403, 404, 500...)
        return Promise.reject(error);
    }
);

async function handleLogout() {
    try {
        await instance.post("/auths/logout");
    } catch (logoutError) {
        console.error("Logout error:", logoutError);
    }

    // Clear storage
    localStorage.clear();
    sessionStorage.clear();

    // Redirect về login
    console.log("🚪 Redirecting to login...");
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}

export default instance;
