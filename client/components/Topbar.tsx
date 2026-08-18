"use client";
import Image from "next/image";
import { useUser } from "@/components/UserProvider";

export function Topbar() {
	const { user, logout } = useUser();

	return (
		<header className="topbar">
			<div className="nav">
				<Image
					src="/img/mead_maker_logo.png"
					alt="Mead Makers"
					width={25}
					height={25}
				/>
				<span className="nav-brand">Mead Makers</span>
				<div>{user?.name}</div>
				<button type="button" className="btn btn-secondary" onClick={logout}>
					Log Out
				</button>
			</div>
		</header>
	);
}
