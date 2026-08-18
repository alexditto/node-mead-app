"use client";

import { useCallback } from "react";
import { useUser } from "@/components/UserProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useApi() {
	const { setUser } = useUser();

	const apiFetch = useCallback(
		async (path: string, init?: RequestInit) => {
			const response = await fetch(`${API_URL}${path}`, {
				...init,
				credentials: "include",
			});

			if (response.status === 401) {
				setUser(null);
			}

			return response;
		},
		[setUser],
	);

	return { apiFetch };
}
