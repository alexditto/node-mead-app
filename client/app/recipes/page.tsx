"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NewRecipeModal } from "@/components/NewRecipeModal";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useApi } from "@/hooks/useApi";
import { useRequireUser } from "@/hooks/useRequireUser";
import styles from "./recipes.module.css";

type Recipe = {
	id: number;
	name: string;
	ingredients: string;
};

export default function RecipesPage() {
	const { user, loading } = useRequireUser();
	const { apiFetch } = useApi();
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [recipesLoading, setRecipesLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [modalOpen, setModalOpen] = useState(false);

	const loadRecipes = useCallback(async () => {
		setRecipesLoading(true);
		const response = await apiFetch("/api/recipes");
		if (response.ok) {
			setRecipes(await response.json());
		}
		setRecipesLoading(false);
	}, [apiFetch]);

	useEffect(() => {
		if (user) loadRecipes();
	}, [user, loadRecipes]);

	const filteredRecipes = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return recipes;
		return recipes.filter((recipe) =>
			recipe.name.toLowerCase().includes(query),
		);
	}, [recipes, search]);

	if (loading || !user) return null;

	return (
		<>
			<Topbar />
			<div className="app-shell">
				<Sidebar />
				<main className="app-shell-content">
					<div className={styles.toolbar}>
						<h1>My Recipes</h1>
						<div className={styles.searchField}>
							<Search size={16} strokeWidth={1.75} />
							<input
								type="search"
								className="input"
								placeholder="Search recipes"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</div>
						<button
							type="button"
							className="btn btn-primary"
							onClick={() => setModalOpen(true)}
						>
							+ New Recipe
						</button>
					</div>
					{recipesLoading ? (
						<p className="text-muted">Loading…</p>
					) : filteredRecipes.length === 0 ? (
						<p className="text-muted">
							{recipes.length === 0
								? "No recipes yet."
								: "No recipes match your search."}
						</p>
					) : (
						<div className={styles.grid}>
							{filteredRecipes.map((recipe) => (
								<div key={recipe.id} className="card">
									<h3 className="card-title">{recipe.name}</h3>
									<p className="card-body">{recipe.ingredients}</p>
								</div>
							))}
						</div>
					)}
				</main>
			</div>
			{modalOpen && (
				<NewRecipeModal
					onClose={() => setModalOpen(false)}
					onCreated={() => {
						setModalOpen(false);
						loadRecipes();
					}}
				/>
			)}
		</>
	);
}
