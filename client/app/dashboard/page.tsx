"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useApi } from "@/hooks/useApi";
import { useRequireUser } from "@/hooks/useRequireUser";
import styles from "./dashboard.module.css";

type BatchStatus = "ACTIVE" | "CLEARING" | "BOTTLED" | "FAILED";

type Batch = {
	id: number;
	status: BatchStatus;
	startDate: string;
	originalGravity: number | null;
	recipe: { id: number; name: string };
};

type StatusCounts = Record<BatchStatus, number>;

const STATUS_LABELS: { key: BatchStatus; label: string }[] = [
	{ key: "ACTIVE", label: "Active" },
	{ key: "CLEARING", label: "Clearing" },
	{ key: "BOTTLED", label: "Bottled" },
	{ key: "FAILED", label: "Failed" },
];

function estimatedCompletionDate(startDate: string) {
	const date = new Date(startDate);
	date.setMonth(date.getMonth() + 3);
	return date;
}

export default function DashboardPage() {
	const { user, loading } = useRequireUser();
	const { apiFetch } = useApi();
	const [batches, setBatches] = useState<Batch[]>([]);
	const [batchesLoading, setBatchesLoading] = useState(true);

	useEffect(() => {
		if (!user) return;
		apiFetch("/api/batches")
			.then((res) => (res.ok ? res.json() : []))
			.then((data: Batch[]) => setBatches(data))
			.finally(() => setBatchesLoading(false));
	}, [user, apiFetch]);

	const counts = useMemo(() => {
		const next: StatusCounts = { ACTIVE: 0, CLEARING: 0, BOTTLED: 0, FAILED: 0 };
		for (const batch of batches) {
			next[batch.status] += 1;
		}
		return next;
	}, [batches]);

	const activeBatches = useMemo(
		() => batches.filter((batch) => batch.status === "ACTIVE"),
		[batches],
	);

	if (loading || !user) return null;

	return (
		<>
			<Topbar />
			<div className="app-shell">
				<Sidebar />
				<main className="app-shell-content">
					<h1>Welcome, {user.name}</h1>
					<p className="text-muted">Here&apos;s a quick look at your cellar.</p>
					{batchesLoading ? (
						<p className="text-muted">Loading…</p>
					) : (
						<div className={styles.stats}>
							<div className="card">
								<span className="card-kicker">Total Batches</span>
								<h2 className="card-title">{batches.length}</h2>
							</div>
							{STATUS_LABELS.map(({ key, label }) => (
								<div key={key} className="card">
									<span className="card-kicker">{label}</span>
									<h2 className="card-title">{counts[key]}</h2>
								</div>
							))}
						</div>
					)}

					<h2 className={styles.sectionTitle}>Active Batches</h2>
					{batchesLoading ? (
						<p className="text-muted">Loading…</p>
					) : activeBatches.length === 0 ? (
						<p className="text-muted">No active batches.</p>
					) : (
						<table className="table">
							<thead>
								<tr>
									<th>Name</th>
									<th>Status</th>
									<th>Original Gravity</th>
									<th>Est. Completion</th>
								</tr>
							</thead>
							<tbody>
								{activeBatches.map((batch) => (
									<tr key={batch.id}>
										<td>{batch.recipe.name}</td>
										<td>
											<span className="tag tag-accent">{batch.status}</span>
										</td>
										<td>{batch.originalGravity ?? "—"}</td>
										<td>{estimatedCompletionDate(batch.startDate).toLocaleDateString()}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</main>
			</div>
		</>
	);
}
