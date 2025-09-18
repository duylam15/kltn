import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Routes";
import { AuthProvider } from "./hooks/AuthProvider";
import "./App.css"; 
/**
 * App gọn nhẹ dùng RouterProvider với router đã có sẵn.
 * - Hỗ trợ lazy routes qua <Suspense>.
 * - Không thêm provider khác để dễ nhúng vào mọi project.
 */
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="p-4">Đang tải…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}
