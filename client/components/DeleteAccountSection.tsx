"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/components/UserProvider";
import { useApi } from "@/hooks/useApi";
import styles from "./DeleteAccountSection.module.css";

const CONFIRM_PHRASE = "good-bye";

export function DeleteAccountSection() {
	const router = useRouter();
	const { user, setUser } = useUser();
	const { apiFetch } = useApi();
	const [confirmText, setConfirmText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canDelete = confirmText === CONFIRM_PHRASE;

	async function handleDelete() {
		if (!user || !canDelete) return;

		setError(null);
		setSubmitting(true);
		try {
			const response = await apiFetch(`/api/users/${user.id}`, { method: "DELETE" });

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				setError(data.error ?? "Something went wrong. Please try again.");
				return;
			}

			setUser(null);
			router.replace("/login");
		} catch {
			setError("Unable to reach the server. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className={`card ${styles.dangerZone}`}>
			<h2 className="card-title">Delete Account</h2>
			<p className="card-body">
				Deleting your account cannot be undone. Type <strong>{CONFIRM_PHRASE}</strong> below to
				confirm.
			</p>
			<div className="field">
				<label htmlFor="deleteConfirm">Confirmation</label>
				<input
					id="deleteConfirm"
					className="input"
					type="text"
					value={confirmText}
					onChange={(event) => setConfirmText(event.target.value)}
					placeholder={CONFIRM_PHRASE}
				/>
			</div>
			{error && <p className="form-error">{error}</p>}
			<button
				type="button"
				className={`btn ${styles.deleteButton}`}
				disabled={!canDelete || submitting}
				onClick={handleDelete}
			>
				Delete My Account
			</button>
		</div>
	);
}
