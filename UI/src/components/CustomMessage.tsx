// CustomMessage.tsx
import { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
	type?: "success" | "error" | "info";
	content: string;
	duration?: number;
	onClose?: () => void;
};

export default function CustomMessage({
	type = "info",
	content,
	duration = 3000,
	onClose,
}: Props) {
	useEffect(() => {
		const timer = setTimeout(() => {
			onClose?.();
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, onClose]);

	return createPortal(
		<div
			style={{
				position: "fixed",
				top: 24,
				right: 24,
				zIndex: 9999,
				padding: "12px 20px",
				borderRadius: 6,
				color: "white",
				fontWeight: 500,
				boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
				backgroundColor:
					type === "success"
						? "#52c41a"
						: type === "error"
							? "#ff4d4f"
							: "#1890ff",
			}}
		>
			{content}
		</div>,
		document.body
	);
}
