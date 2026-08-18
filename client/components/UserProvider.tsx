"use client";

import { useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

export type CurrentUser = {
	id: number;
	name: string;
	email: string;
	role: string;
};

type UserContextValue = {
	user: CurrentUser | null;
	loading: boolean;
	setUser: (user: CurrentUser | null) => void;
	logout: () => Promise<void>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
			.then((res) => {
				if (!res.ok) throw new Error("Not authenticated");
				return res.json();
			})
			.then((data) => setUser(data.user))
			.catch(() => setUser(null))
			.finally(() => setLoading(false));
	}, []);

	const logout = useCallback(async () => {
		await fetch(`${API_URL}/api/auth/logout`, {
			method: "POST",
			credentials: "include",
		});
		setUser(null);
		router.replace("/login");
	}, [router]);

	return (
		<UserContext.Provider value={{ user, loading, setUser, logout }}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
}
