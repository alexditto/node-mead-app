"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SendFriendRequestForm } from "@/components/SendFriendRequestForm";
import { Topbar } from "@/components/Topbar";
import { useApi } from "@/hooks/useApi";
import { useRequireUser } from "@/hooks/useRequireUser";
import styles from "./friends.module.css";

type PublicUser = {
	id: number;
	name: string;
	email: string;
};

type FriendEntry = {
	id: number;
	user: PublicUser;
	acceptedAt: string | null;
};

type RequestEntry = {
	id: number;
	user: PublicUser;
	createdAt: string;
};

type FriendsData = {
	friends: FriendEntry[];
	sentRequests: RequestEntry[];
	incomingRequests: RequestEntry[];
};

const EMPTY_DATA: FriendsData = { friends: [], sentRequests: [], incomingRequests: [] };

export default function FriendsPage() {
	const { user, loading } = useRequireUser();
	const { apiFetch } = useApi();
	const [data, setData] = useState<FriendsData>(EMPTY_DATA);
	const [dataLoading, setDataLoading] = useState(true);
	const [actionError, setActionError] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		setDataLoading(true);
		const response = await apiFetch("/api/friends");
		if (response.ok) {
			setData(await response.json());
		}
		setDataLoading(false);
	}, [apiFetch]);

	useEffect(() => {
		if (user) loadData();
	}, [user, loadData]);

	async function respond(requestId: number, action: "accept" | "reject") {
		setActionError(null);
		const response = await apiFetch(`/api/friends/${requestId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action }),
		});
		if (!response.ok) {
			const responseData = await response.json().catch(() => ({}));
			setActionError(responseData.error ?? "Something went wrong. Please try again.");
			return;
		}
		loadData();
	}

	if (loading || !user) return null;

	return (
		<>
			<Topbar />
			<div className="app-shell">
				<Sidebar />
				<main className="app-shell-content">
					<h1>Friends</h1>
					<div className={styles.stack}>
						<SendFriendRequestForm onSent={loadData} />

						{data.incomingRequests.length > 0 && (
							<div className="card">
								<h2 className="card-title">Incoming Requests</h2>
								{actionError && <p className="form-error">{actionError}</p>}
								<ul className={styles.list}>
									{data.incomingRequests.map((request) => (
										<li key={request.id} className={styles.listItem}>
											<span>{request.user.name}</span>
											<div className={styles.actions}>
												<button
													type="button"
													className="btn btn-primary"
													onClick={() => respond(request.id, "accept")}
												>
													Accept
												</button>
												<button
													type="button"
													className="btn btn-secondary"
													onClick={() => respond(request.id, "reject")}
												>
													Reject
												</button>
											</div>
										</li>
									))}
								</ul>
							</div>
						)}

						<div className="card">
							<h2 className="card-title">Sent Requests</h2>
							{dataLoading ? (
								<p className="text-muted">Loading…</p>
							) : data.sentRequests.length === 0 ? (
								<p className="text-muted">No pending sent requests.</p>
							) : (
								<ul className={styles.list}>
									{data.sentRequests.map((request) => (
										<li key={request.id} className={styles.listItem}>
											<span>{request.user.name}</span>
											<span className="tag tag-neutral">Pending</span>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="card">
							<h2 className="card-title">My Friends</h2>
							{dataLoading ? (
								<p className="text-muted">Loading…</p>
							) : data.friends.length === 0 ? (
								<p className="text-muted">No friends yet.</p>
							) : (
								<ul className={styles.list}>
									{data.friends.map((friend) => (
										<li key={friend.id} className={styles.listItem}>
											<span>{friend.user.name}</span>
											<span className="text-muted">{friend.user.email}</span>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</main>
			</div>
		</>
	);
}
