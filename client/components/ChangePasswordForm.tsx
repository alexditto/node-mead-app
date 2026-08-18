"use client";

import { useState, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";

export function ChangePasswordForm() {
	const { apiFetch } = useApi();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setSuccess(false);

		if (!currentPassword || !newPassword || !confirmPassword) {
			setError("All fields are required");
			return;
		}
		if (newPassword.length < 10) {
			setError("New password must be at least 10 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("New passwords do not match");
			return;
		}

		setSubmitting(true);
		try {
			const response = await apiFetch("/api/users/me/password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentPassword, newPassword }),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				setError(data.error ?? "Something went wrong. Please try again.");
				return;
			}

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setSuccess(true);
		} catch {
			setError("Unable to reach the server. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form className="card" onSubmit={handleSubmit} noValidate>
			<h2 className="card-title">Change Password</h2>
			<div className="field">
				<label htmlFor="currentPassword">Current Password</label>
				<input
					id="currentPassword"
					className="input"
					type="password"
					value={currentPassword}
					onChange={(event) => setCurrentPassword(event.target.value)}
				/>
			</div>
			<div className="field">
				<label htmlFor="newPassword">New Password</label>
				<input
					id="newPassword"
					className="input"
					type="password"
					minLength={10}
					value={newPassword}
					onChange={(event) => setNewPassword(event.target.value)}
				/>
			</div>
			<div className="field">
				<label htmlFor="confirmNewPassword">Confirm New Password</label>
				<input
					id="confirmNewPassword"
					className="input"
					type="password"
					minLength={10}
					value={confirmPassword}
					onChange={(event) => setConfirmPassword(event.target.value)}
				/>
			</div>
			{error && <p className="form-error">{error}</p>}
			{success && <p className="text-muted">Password updated.</p>}
			<button type="submit" className="btn btn-primary" disabled={submitting}>
				Update Password
			</button>
		</form>
	);
}
