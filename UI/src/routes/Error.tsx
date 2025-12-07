import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function Error() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">

        <div className="flex justify-center mb-6">
          <AlertTriangle className="size-16 text-yellow-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Tính năng đang được cập nhật!
        </h1>

        <p className="text-gray-600 mb-6">
          Chúng tôi đang hoàn thiện tính năng này. Vui lòng quay lại sau nhé.
        </p>

        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
        >
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
