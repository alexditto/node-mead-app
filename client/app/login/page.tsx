import Image from "next/image";
import { AuthForm } from "@/components/AuthForm";
import styles from "./login.module.css";

export default function LoginPage() {
	return (
		<main className={styles.page}>
			<div className={styles.container}>
				<Image
					className={styles.logo}
					src="/img/mead_maker_logo.png"
					alt="Mead Makers"
					width={160}
					height={150}
					priority
				/>
				<h1 className={styles.title}>Mead Makers</h1>
				<AuthForm />
			</div>
		</main>
	);
}
