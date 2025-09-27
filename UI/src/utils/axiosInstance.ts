import axios from "axios";
import { Mutex } from "async-mutex";

const mutex = new Mutex();
const baseUrl = "http://localhost:4000/api/v1";

const instance = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
});

// Luôn gắn token mới nhất vào request
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

export const handleRefreshToken = async () => {
    return await mutex.runExclusive(async () => {
        try {
            const res = await instance.post("/auth/refresh_token");
            if (res?.data?.accessToken) {
                console.log("Token làm mới thành công:", res.data.accessToken);
                localStorage.setItem("access_token", res.data.accessToken);
                return res.data.accessToken;
            }
            return null;
        } catch (err) {
            return null;
        }
    });
};

const NO_RETRY_HEADER = "x-no-retry";

instance.interceptors.response.use(
    (response) => response.data ?? response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu access token hết hạn
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest.headers[NO_RETRY_HEADER]
        ) {
            originalRequest.headers[NO_RETRY_HEADER] = "true";

            const newAccessToken = await handleRefreshToken();
            if (newAccessToken) {
                originalRequest.headers[
                    "Authorization"
                ] = `Bearer ${newAccessToken}`;
                return instance.request(originalRequest);
            } else {
                // Refresh fail -> logout
                await instance.post("/auth/logout").catch(() => {});
                localStorage.removeItem("access_token");
                window.location.href = "/login";
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
