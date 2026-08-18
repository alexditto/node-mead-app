"use client";

import styles from "./FilterBar.module.css";

export type StatusFilter = "ALL" | "ACTIVE" | "CLEARING" | "BOTTLED" | "FAILED";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
	{ value: "ALL", label: "All" },
	{ value: "ACTIVE", label: "Active" },
	{ value: "CLEARING", label: "Clearing" },
	{ value: "BOTTLED", label: "Bottled" },
	{ value: "FAILED", label: "Failed" },
];

type FilterBarProps = {
	status: StatusFilter;
	onStatusChange: (status: StatusFilter) => void;
	onNewBatch: () => void;
};

export function FilterBar({ status, onStatusChange, onNewBatch }: FilterBarProps) {
	return (
		<div className={styles.bar}>
			<div className="seg" role="radiogroup" aria-label="Filter by status">
				{STATUS_TABS.map((tab) => (
					<label key={tab.value} className="seg-opt">
						<input
							type="radio"
							name="statusFilter"
							value={tab.value}
							checked={status === tab.value}
							onChange={() => onStatusChange(tab.value)}
						/>
						{tab.label}
					</label>
				))}
			</div>
			<button type="button" className="btn btn-primary" onClick={onNewBatch}>
				+ New Batch
			</button>
		</div>
	);
}
