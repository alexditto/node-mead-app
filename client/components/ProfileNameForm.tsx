"use client";

import { useState, type FormEvent } from "react";
import { useUser } from "@/components/UserProvider";
import { useApi } from "@/hooks/useApi";

export function ProfileNameForm() {
	const { user, setUser } = useUser();
	const { apiFetch } = useApi();
	const [name, setName] = useState(user?.name ?? "");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setSuccess(false);

		if (!name.trim()) {
			setError("Name is required");
			return;
		}

		setSubmitting(true);
		try {
			const response = await apiFetch("/api/users/me", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				setError(data.error ?? "Something went wrong. Please try again.");
				return;
			}

			setUser(data.user);
			setSuccess(true);
		} catch {
			setError("Unable to reach the server. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form className="card" onSubmit={handleSubmit} noValidate>
			<h2 className="card-title">Profile</h2>
			<div className="field">
				<label htmlFor="settings-name">Name</label>
				<input
					id="settings-name"
					className="input"
					type="text"
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</div>
			{error && <p className="form-error">{error}</p>}
			{success && <p className="text-muted">Name updated.</p>}
			<button type="submit" className="btn btn-primary" disabled={submitting}>
				Save Name
			</button>
		</form>
	);
}
