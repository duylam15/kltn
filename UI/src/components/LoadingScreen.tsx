const LoadingScreen: React.FC<{ message?: string }> = ({
	message = '⏳ Đang kiểm tra đăng nhập...'
}) => {
	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<p className="text-lg text-gray-700">{message}</p>
			</div>
		</div>
	);
};

export default LoadingScreen;