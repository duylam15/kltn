import { useEffect, useState } from "react";
import instance from "../../utils/axiosInstance";

export default function TestRefreshToken() {
	const [userData, setUserData] = useState<any>(null);
	const [error, setError] = useState<string>("");
	const [lastCall, setLastCall] = useState<string>("");
	const [callCount, setCallCount] = useState<number>(0);

	// Gọi API /me mỗi 10 giây để test tự động refresh
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				console.log(`📞 [${callCount + 1}] Calling /auths/me...`);

				// ✅ response đã là data (do interceptor return response.data)
				const response:any = await instance.get("/auths/me");

				if (response.success) {
					setUserData(response.user);
					setError("");
					setLastCall(new Date().toLocaleTimeString());
					setCallCount((prev) => prev + 1);
					console.log("✅ /auths/me success:", response.user);
				}
			} catch (err: any) {
				console.error("❌ /auths/me failed:", err);
				setError(err.message || "API call failed");
			}
		}, 10000); // 10 giây

		return () => clearInterval(interval);
	}, [callCount]);

	const handleManualCall = async () => {
		try {
			console.log("📞 Manual call /auths/me...");
			const response:any = await instance.get("/auths/me");

			if (response.success) {
				setUserData(response.user);
				setError("");
				setLastCall(new Date().toLocaleTimeString());
				setCallCount((prev) => prev + 1);
				console.log("✅ Manual call success");
			}
		} catch (err: any) {
			console.error("❌ Manual call failed:", err);
			setError(err.message || "Manual call failed");
		}
	};

	return (
		<div style={{ padding: "20px", fontFamily: "monospace" }}>
			<h2>🧪 Test Auto Refresh Token</h2>
			<div style={{ background: "#e3f2fd", padding: "10px", borderRadius: "5px", marginBottom: "20px" }}>
				<p>⏱️ <strong>Access Token TTL:</strong> 1 phút</p>
				<p>🔄 <strong>Auto call every:</strong> 10 seconds</p>
				<p>📊 <strong>Total calls:</strong> {callCount}</p>
			</div>

			<button
				onClick={handleManualCall}
				style={{
					padding: "10px 20px",
					background: "#1976d2",
					color: "white",
					border: "none",
					borderRadius: "5px",
					cursor: "pointer",
					fontSize: "14px",
				}}
			>
				📞 Manual Call /auths/me
			</button>

			{lastCall && (
				<p style={{ marginTop: "20px", color: "#2e7d32" }}>
					✅ <strong>Last successful call:</strong> {lastCall}
				</p>
			)}

			{error && (
				<p style={{ marginTop: "20px", color: "#d32f2f" }}>
					❌ <strong>Error:</strong> {error}
				</p>
			)}

			{userData && (
				<div
					style={{
						background: "#f5f5f5",
						padding: "15px",
						marginTop: "20px",
						borderRadius: "5px",
						border: "1px solid #e0e0e0",
					}}
				>
					<h3>👤 User Data:</h3>
					<pre style={{ overflow: "auto" }}>
						{JSON.stringify(userData, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}