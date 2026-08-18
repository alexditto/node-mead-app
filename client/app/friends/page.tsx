import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function FriendsPage() {
	return (
		<>
			<Topbar />
			<div className="app-shell">
				<Sidebar />
				<main className="app-shell-content">
					<h1>Friends</h1>
					<p className="text-muted">Coming soon.</p>
				</main>
			</div>
		</>
	);
}
