import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function RecipesPage() {
	return (
		<>
			<Topbar />
			<div className="app-shell">
				<Sidebar />
				<main className="app-shell-content">
					<h1>Recipes</h1>
					<p className="text-muted">Coming soon.</p>
				</main>
			</div>
		</>
	);
}
