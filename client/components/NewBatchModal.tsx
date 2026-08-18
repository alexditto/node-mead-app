"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";

type Recipe = {
	id: number;
	name: string;
};

type NewBatchModalProps = {
	onClose: () => void;
	onCreated: () => void;
};

function todayIsoDate() {
	return new Date().toISOString().slice(0, 10);
}

export function NewBatchModal({ onClose, onCreated }: NewBatchModalProps) {
	const { apiFetch } = useApi();
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [recipesLoading, setRecipesLoading] = useState(true);
	const [recipeId, setRecipeId] = useState("");
	const [startDate, setStartDate] = useState(todayIsoDate);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		apiFetch("/api/recipes")
			.then((res) => (res.ok ? res.json() : []))
			.then((data: Recipe[]) => {
				setRecipes(data);
				if (data.length > 0) setRecipeId(String(data[0].id));
			})
			.finally(() => setRecipesLoading(false));
	}, [apiFetch]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		if (!recipeId) {
			setError("Select a recipe");
			return;
		}

		setSubmitting(true);
		try {
			const response = await apiFetch("/api/batches", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ recipeId: Number(recipeId), startDate }),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				setError(data.error ?? "Something went wrong. Please try again.");
				return;
			}

			onCreated();
		} catch {
			setError("Unable to reach the server. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="dialog-backdrop" onClick={onClose}>
			<form
				className="dialog"
				onClick={(event) => event.stopPropagation()}
				onSubmit={handleSubmit}
				noValidate
			>
				<h3 className="dialog-title">New Batch</h3>
				<div className="dialog-body">
					{recipesLoading ? (
						<p className="text-muted">Loading recipes…</p>
					) : recipes.length === 0 ? (
						<p className="text-muted">You don&apos;t have any recipes yet. Create one first.</p>
					) : (
						<>
							<div className="field">
								<label htmlFor="recipeId">Recipe</label>
								<select
									id="recipeId"
									className="input"
									value={recipeId}
									onChange={(event) => setRecipeId(event.target.value)}
								>
									{recipes.map((recipe) => (
										<option key={recipe.id} value={recipe.id}>
											{recipe.name}
										</option>
									))}
								</select>
							</div>
							<div className="field">
								<label htmlFor="startDate">Start Date</label>
								<input
									id="startDate"
									className="input"
									type="date"
									value={startDate}
									onChange={(event) => setStartDate(event.target.value)}
								/>
							</div>
						</>
					)}
					{error && <p className="form-error">{error}</p>}
				</div>
				<div className="dialog-actions">
					<button type="button" className="btn btn-secondary" onClick={onClose}>
						Cancel
					</button>
					<button
						type="submit"
						className="btn btn-primary"
						disabled={submitting || recipesLoading || recipes.length === 0}
					>
						Create Batch
					</button>
				</div>
			</form>
		</div>
	);
}
