import Link from "next/link";
import { SITE_INFO } from "@/site/brand";

const links = [
	{ label: "Privacy", href: "/privacy" },
	{ label: "Terms of use", href: "/terms" },
];

export function Footer() {
	return (
		<footer className="bg-background border-t">
			<div className="mx-auto max-w-5xl px-8 py-8">
				<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
					<div className="text-muted-foreground text-sm">
						© {new Date().getFullYear()} {SITE_INFO.title}
					</div>
					<nav className="flex items-center gap-5 text-sm">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>
			</div>
		</footer>
	);
}
