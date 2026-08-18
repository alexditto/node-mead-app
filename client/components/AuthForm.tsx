"use client";

import { useRouter } from "next/navigation";
import {
	useState,
	type ChangeEvent,
	type FocusEvent,
	type FormEvent,
} from "react";
import styles from "./AuthForm.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AuthMode = "login" | "register";
type FieldName = "name" | "email" | "password" | "confirmPassword";
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialValues: FormValues = {
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
};

function validateField(
	field: FieldName,
	values: FormValues,
	mode: AuthMode,
): string | undefined {
	const value = values[field];

	if (field === "name") {
		if (mode === "register" && !value.trim()) return "Name is required";
		return undefined;
	}

	if (field === "email") {
		if (!value.trim()) return "Email is required";
		if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address";
		return undefined;
	}

	if (field === "password") {
		if (!value) return "Password is required";
		if (value.length < 10) return "Password must be at least 10 characters";
		return undefined;
	}

	if (field === "confirmPassword") {
		if (mode !== "register") return undefined;
		if (!value) return "Please confirm your password";
		if (value !== values.password) return "Passwords do not match";
		return undefined;
	}

	return undefined;
}

export function AuthForm() {
	const router = useRouter();
	const [mode, setMode] = useState<AuthMode>("login");
	const [values, setValues] = useState<FormValues>(initialValues);
	const [errors, setErrors] = useState<FormErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		setValues((prev) => ({ ...prev, [name]: value }));
	}

	function handleBlur(event: FocusEvent<HTMLInputElement>) {
		const field = event.target.name as FieldName;
		setErrors((prev) => ({
			...prev,
			[field]: validateField(field, values, mode),
		}));
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);

		const fields: FieldName[] =
			mode === "register"
				? ["name", "email", "password", "confirmPassword"]
				: ["email", "password"];

		const nextErrors: FormErrors = {};
		for (const field of fields) {
			const error = validateField(field, values, mode);
			if (error) nextErrors[field] = error;
		}
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		const endpoint =
			mode === "register" ? "/api/auth/register" : "/api/auth/login";
		const payload =
			mode === "register"
				? { name: values.name, email: values.email, password: values.password }
				: { email: values.email, password: values.password };

		setSubmitting(true);
		try {
			const response = await fetch(`${API_URL}${endpoint}`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				setFormError(data.error ?? "Something went wrong. Please try again.");
				return;
			}

			router.push("/dashboard");
		} catch {
			setFormError("Unable to reach the server. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	function switchMode(nextMode: AuthMode) {
		setMode(nextMode);
		setErrors({});
	}

	return (
		<form className="card" onSubmit={handleSubmit} noValidate>
			<div
				className={`seg ${styles.modeToggle}`}
				role="radiogroup"
				aria-label="Log in or register"
			>
				<label className="seg-opt">
					<input
						type="radio"
						name="authMode"
						value="login"
						checked={mode === "login"}
						onChange={() => switchMode("login")}
					/>
					Log In
				</label>
				<label className="seg-opt">
					<input
						type="radio"
						name="authMode"
						value="register"
						checked={mode === "register"}
						onChange={() => switchMode("register")}
					/>
					Register
				</label>
			</div>

			{mode === "register" && (
				<div className="field">
					<label htmlFor="name">Name</label>
					<input
						id="name"
						name="name"
						className="input"
						type="text"
						value={values.name}
						onChange={handleChange}
						onBlur={handleBlur}
						aria-invalid={Boolean(errors.name)}
						aria-describedby={errors.name ? "name-error" : undefined}
					/>
					{errors.name && (
						<p id="name-error" className="field-error">
							{errors.name}
						</p>
					)}
				</div>
			)}

			<div className="field">
				<label htmlFor="email">Email</label>
				<input
					id="email"
					name="email"
					className="input"
					type="email"
					value={values.email}
					onChange={handleChange}
					onBlur={handleBlur}
					aria-invalid={Boolean(errors.email)}
					aria-describedby={errors.email ? "email-error" : undefined}
				/>
				{errors.email && (
					<p id="email-error" className="field-error">
						{errors.email}
					</p>
				)}
			</div>

			<div className="field">
				<label htmlFor="password">Password</label>
				<input
					id="password"
					name="password"
					className="input"
					type="password"
					value={values.password}
					onChange={handleChange}
					onBlur={handleBlur}
					aria-invalid={Boolean(errors.password)}
					aria-describedby={errors.password ? "password-error" : undefined}
				/>
				{errors.password && (
					<p id="password-error" className="field-error">
						{errors.password}
					</p>
				)}
			</div>

			{mode === "register" && (
				<div className="field">
					<label htmlFor="confirmPassword">Confirm Password</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						className="input"
						type="password"
						value={values.confirmPassword}
						onChange={handleChange}
						onBlur={handleBlur}
						aria-invalid={Boolean(errors.confirmPassword)}
						aria-describedby={
							errors.confirmPassword ? "confirmPassword-error" : undefined
						}
					/>
					{errors.confirmPassword && (
						<p id="confirmPassword-error" className="field-error">
							{errors.confirmPassword}
						</p>
					)}
				</div>
			)}

			{formError && <p className="form-error">{formError}</p>}

			<button
				type="submit"
				className="btn btn-primary btn-block"
				disabled={submitting}
			>
				{mode === "login" ? "Log In" : "Create Account"}
			</button>
		</form>
	);
}
