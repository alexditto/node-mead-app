"use client";

import { useState, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";

type NewRecipeModalProps = {
	onClose: () => void;
	onCreated: () => void;
};

export function NewRecipeModal({ onClose, onCreated }: NewRecipeModalProps) {
	const { apiFetch } = useApi();
	const [name, setName] = useState("");
	const [ingredients, setIngredients] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		if (!name.trim() || !ingredients.trim()) {
			setError("Name and ingredients are required");
			return;
		}

		setSubmitting(true);
		try {
			const response = await apiFetch("/api/recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, ingredients }),
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
				<h3 className="dialog-title">New Recipe</h3>
				<div className="dialog-body">
					<div className="field">
						<label htmlFor="name">Name</label>
						<input
							id="name"
							className="input"
							type="text"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>
					<div className="field">
						<label htmlFor="ingredients">Ingredients</label>
						<textarea
							id="ingredients"
							className="input"
							rows={4}
							value={ingredients}
							onChange={(event) => setIngredients(event.target.value)}
						/>
					</div>
					{error && <p className="form-error">{error}</p>}
				</div>
				<div className="dialog-actions">
					<button type="button" className="btn btn-secondary" onClick={onClose}>
						Cancel
					</button>
					<button type="submit" className="btn btn-primary" disabled={submitting}>
						Create Recipe
					</button>
				</div>
			</form>
		</div>
	);
}
