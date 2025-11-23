import { useEffect, useState } from "react";
import instance from "../../utils/axiosInstance";

export default function TestRefreshToken() {
	const [userData, setUserData] = useState<any>(null);
	const [error, setError] = useState<string>("");
	const [lastCall, setLastCall] = useState<string>("");

	// Gọi API /me mỗi 10 giây để test tự động refresh
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				console.log("📞 Calling /auth/me...");
				const response = await instance.get("/auths/me");

				if (response.success) {
					setUserData(response.user);
					setError("");
					setLastCall(new Date().toLocaleTimeString());
					console.log("✅ /auth/me success:", response.user);
				}
			} catch (err: any) {
				console.error("❌ /auth/me failed:", err);
				setError(err.message || "API call failed");
			}
		}, 10000); // 10 giây

		return () => clearInterval(interval);
	}, []);

	const handleManualCall = async () => {
		try {
			console.log("📞 Manual call /auth/me...");
			const response = await instance.get("/auths/me");

			if (response.success) {
				setUserData(response.user);
				setError("");
				setLastCall(new Date().toLocaleTimeString());
				console.log("✅ Manual call success");
			}
		} catch (err: any) {
			console.error("❌ Manual call failed:", err);
			setError(err.message || "Manual call failed");
		}
	};

	return (
		<div style={{ padding: "20px" }}>
			<h2>Test Auto Refresh Token</h2>
			<p>Access Token TTL: 1 phút</p>
			<p>Auto call every 10 seconds</p>

			<button onClick={handleManualCall}>
				Manual Call /auth/me
			</button>

			{lastCall && <p>Last successful call: {lastCall}</p>}
			{error && <p style={{ color: "red" }}>Error: {error}</p>}

			{userData && (
				<div style={{
					background: "#f0f0f0",
					padding: "10px",
					marginTop: "10px",
					borderRadius: "5px"
				}}>
					<h3>User Data:</h3>
					<pre>{JSON.stringify(userData, null, 2)}</pre>
				</div>
			)}
		</div>
	);
}