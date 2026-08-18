"use client";

import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { ProfileNameForm } from "@/components/ProfileNameForm";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useRequireUser } from "@/hooks/useRequireUser";
import styles from "./settings.module.css";

export default function SettingsPage() {
	const { user, loading } = useRequireUser();

	if (loading || !user) return null;

	return (
		<>
			<Topbar />
			<div className="app-shell">
				<Sidebar />
				<main className="app-shell-content">
					<h1>Settings</h1>
					<div className={styles.stack}>
						<ProfileNameForm />
						<ChangePasswordForm />
						<DeleteAccountSection />
					</div>
				</main>
			</div>
		</>
	);
}
