"use client";

import {
	BookOpen,
	FlaskConical,
	LayoutDashboard,
	Settings as SettingsIcon,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/recipes", label: "Recipes", icon: BookOpen },
	{ href: "/batches", label: "Batches", icon: FlaskConical },
	{ href: "/friends", label: "Friends", icon: Users },
	{ href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<nav className={styles.sidebar} aria-label="Primary">
			{NAV_ITEMS.map(({ href, label, icon: Icon }) => {
				const isActive = pathname === href || pathname?.startsWith(`${href}/`);
				return (
					<Link
						key={href}
						href={href}
						className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
						aria-current={isActive ? "page" : undefined}
					>
						<Icon size={18} strokeWidth={1.75} />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
