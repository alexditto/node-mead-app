"use client";

import { useCallback, useEffect, useState } from "react";
import { FilterBar, type StatusFilter } from "@/components/FilterBar";
import { NewBatchModal } from "@/components/NewBatchModal";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useApi } from "@/hooks/useApi";
import { useRequireUser } from "@/hooks/useRequireUser";
import styles from "./batches.module.css";

type Batch = {
	id: number;
	status: "ACTIVE" | "CLEARING" | "BOTTLED" | "FAILED";
	startDate: string;
	recipe: { id: number; name: string };
};

export default function BatchesPage() {
	const { user, loading } = useRequireUser();
	const { apiFetch } = useApi();
	const [status, setStatus] = useState<StatusFilter>("ALL");
	const [batches, setBatches] = useState<Batch[]>([]);
	const [batchesLoading, setBatchesLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);

	const loadBatches = useCallback(async () => {
		setBatchesLoading(true);
		const query = status === "ALL" ? "" : `?status=${status}`;
		const response = await apiFetch(`/api/batches${query}`);
		if (response.ok) {
			setBatches(await response.json());
		}
		setBatchesLoading(false);
	}, [apiFetch, status]);

	useEffect(() => {
		if (user) loadBatches();
	}, [user, loadBatches]);

	if (loading || !user) return null;

	return (
		<>
			<Topbar />
			<div className="app-shell">
				<Sidebar />
				<main className="app-shell-content">
					<h1>Batches</h1>
					<FilterBar status={status} onStatusChange={setStatus} onNewBatch={() => setModalOpen(true)} />
					{batchesLoading ? (
						<p className="text-muted">Loading…</p>
					) : batches.length === 0 ? (
						<p className="text-muted">No batches yet.</p>
					) : (
						<div className={styles.grid}>
							{batches.map((batch) => (
								<div key={batch.id} className="card">
									<span className="card-kicker">{batch.status}</span>
									<h3 className="card-title">{batch.recipe.name}</h3>
									<p className="card-meta">
										Started {new Date(batch.startDate).toLocaleDateString()}
									</p>
								</div>
							))}
						</div>
					)}
				</main>
			</div>
			{modalOpen && (
				<NewBatchModal
					onClose={() => setModalOpen(false)}
					onCreated={() => {
						setModalOpen(false);
						loadBatches();
					}}
				/>
			)}
		</>
	);
}
