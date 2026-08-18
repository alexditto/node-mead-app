"use client";
import { useRouter } from "next/navigation";

export function Topbar() {
	const API_URL = process.env.NEXT_PUBLIC_API_URL;
	const router = useRouter();
	async function handleLogout() {
		await fetch(`${API_URL}/api/auth/logout`, {
			method: "POST",
			credentials: "include",
		});
		router.replace("/login");
	}
	return (
		<header className="topbar">
			<div className="nav">
				<span className="nav-brand">Mead Makers</span>
				<button
					type="button"
					className="btn btn-secondary"
					onClick={handleLogout}
				>
					Log Out
				</button>
			</div>
		</header>
	);
}
