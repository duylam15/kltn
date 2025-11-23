import axios from "axios";

const baseUrl = "http://localhost:4000/api/v1";

const instance = axios.create({
    baseURL: baseUrl,
    withCredentials: true, // ✅ Quan trọng: gửi cookie tự động
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
    (response) => response.data ?? response,
    async (error) => {
        const originalRequest = error.config;

        console.log("🔴 API Error:", {
            url: originalRequest?.url,
            status: error.response?.status,
            code: error.response?.data?.code,
            message: error.response?.data?.message,
        });

        // Kiểm tra nếu là lỗi 401 và token hết hạn
        if (
            error.response?.status === 401 &&
            error.response?.data?.code === "TOKEN_EXPIRED" &&
            !originalRequest._retry
        ) {
            // Tránh refresh lại chính endpoint refresh
            if (originalRequest.url === "/auths/refresh_token") {
                console.log("❌ Refresh token cũng hết hạn, logout...");
                await handleLogout();
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            // Nếu đang refresh, thêm vào queue
            if (isRefreshing) {
                console.log("⏳ Đang refresh, thêm request vào queue...");
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return instance(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            isRefreshing = true;
            console.log("🔄 Bắt đầu refresh token...");

            try {
                const response = await instance.post("/auths/refresh_token");

                if (response?.success) {
                    console.log("✅ Refresh token thành công!");
                    isRefreshing = false;
                    processQueue(null);

                    // Retry request ban đầu
                    return instance(originalRequest);
                } else {
                    throw new Error("Refresh failed");
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
    console.log("tro ve dang nhap");
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}

export default instance;
