"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/components/UserProvider";

export function useRequireUser() {
	const router = useRouter();
	const { user, loading } = useUser();

	useEffect(() => {
		if (!loading && !user) {
			router.replace("/login");
		}
	}, [loading, user, router]);

	return { user, loading };
}
