"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

type CurrentUser = {
	id: number;
	name: string;
	email: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
	const router = useRouter();
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
			.then((res) => {
				if (!res.ok) throw new Error("Not authenticated");
				return res.json();
			})
			.then((data) => setUser(data.user))
			.catch(() => router.replace("/login"))
			.finally(() => setLoading(false));
	}, [router]);

	async function handleLogout() {
		await fetch(`${API_URL}/api/auth/logout`, {
			method: "POST",
			credentials: "include",
		});
		router.replace("/login");
	}

	if (loading || !user) return null;

	return (
		<>
			<Topbar handleLogout />
			<div className="app-shell">
				<Sidebar />
				<main className="app-shell-content">
					<h1>Welcome, {user.name}</h1>
					<p className="text-muted">You&apos;re logged in as {user.email}.</p>
				</main>
			</div>
		</>
	);
}
