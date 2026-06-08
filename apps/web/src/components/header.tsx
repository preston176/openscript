"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SITE_INFO } from "@/site/brand";

export function Header() {
	return (
		<header className="bg-background shadow-background/85 sticky top-0 z-10 shadow-[0_30px_35px_15px_rgba(0,0,0,1)]">
			<div className="relative flex w-full items-center justify-between px-6 pt-4">
				<div className="relative z-10 flex items-center gap-6">
					<Link href="/" className="flex items-center gap-3">
						<span className="text-lg font-semibold tracking-tight">
							{SITE_INFO.title}
						</span>
					</Link>
				</div>

				<div className="relative z-10">
					<div className="flex items-center gap-3">
						<Link href="/projects">
							<Button className="text-sm">
								Projects
								<ArrowRight className="size-4" />
							</Button>
						</Link>
						<ThemeToggle />
					</div>
				</div>
			</div>
		</header>
	);
}
