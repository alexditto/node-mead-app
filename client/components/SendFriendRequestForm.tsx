"use client";

import { useState, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";

type SendFriendRequestFormProps = {
	onSent: () => void;
};

export function SendFriendRequestForm({ onSent }: SendFriendRequestFormProps) {
	const { apiFetch } = useApi();
	const [identifier, setIdentifier] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setSuccess(false);

		if (!identifier.trim()) {
			setError("Enter an email or name");
			return;
		}

		setSubmitting(true);
		try {
			const response = await apiFetch("/api/friends", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ identifier }),
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				setError(data.error ?? "Something went wrong. Please try again.");
				return;
			}

			setIdentifier("");
			setSuccess(true);
			onSent();
		} catch {
			setError("Unable to reach the server. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form className="card" onSubmit={handleSubmit} noValidate>
			<h2 className="card-title">Add a Friend</h2>
			<div className="field">
				<label htmlFor="friend-identifier">Email or Name</label>
				<input
					id="friend-identifier"
					className="input"
					type="text"
					value={identifier}
					onChange={(event) => setIdentifier(event.target.value)}
					placeholder="e.g. avery@example.com"
				/>
			</div>
			{error && <p className="form-error">{error}</p>}
			{success && <p className="text-muted">Friend request sent.</p>}
			<button type="submit" className="btn btn-primary" disabled={submitting}>
				Send Request
			</button>
		</form>
	);
}
