"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	IconShieldDollar,
	IconLayoutDashboard,
	IconActivity,
	IconFileCheck,
	IconCalculator,
	IconArrowLeft,
} from "@tabler/icons-react";
import { useRider } from "./RiderProvider";

const NAV = [
	{ href: "/app", label: "Dashboard", Icon: IconLayoutDashboard },
	{ href: "/app/shift", label: "Shift", Icon: IconActivity },
	{ href: "/app/claim", label: "Claim", Icon: IconFileCheck },
	{ href: "/app/quote", label: "Quote", Icon: IconCalculator },
] as const;

export function AppNav() {
	const pathname = usePathname();
	const { riderId, clearRider } = useRider();

	return (
		<>
			{/* Same fixed pill as landing Navbar */}
			<header className="fixed top-4 left-4 right-4 z-999">
				<div className="max-w-4xl mx-auto bg-foreground/80 backdrop-blur-md text-background pl-6 pr-1.5 py-1.5 rounded-2xl flex items-center justify-between gap-8">
					<Link
						href="/app"
						className="text-2xl flex items-center select-none active:scale-97 duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
						Shift
						<IconShieldDollar color="#00aaff" aria-hidden />
						<span className="text-accent">hield</span>
					</Link>

					{/* Centered nav — desktop only */}
					<nav className="hidden md:block" aria-label="App navigation">
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-6">
							{NAV.map(({ href, label }) => {
								const active = pathname === href;
								return (
									<Link
										key={href}
										href={href}
										className={`text-sm transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1 ${
											active ? "text-accent font-medium opacity-100" : "hover:opacity-70"
										}`}>
										{label}
									</Link>
								);
							})}
						</div>
					</nav>

					{/* Right side pill — same style as landing CTA */}
					<div className="hidden md:flex items-center justify-center gap-2 bg-background text-foreground rounded-xl p-1">
						{riderId && <span className="font-mono text-[9px] tracking-widest uppercase text-foreground/40 pl-3">{riderId}</span>}
						<div className="flex items-center gap-1">
							{riderId && (
								<button
									onClick={clearRider}
									className="text-sm px-2 py-1.5 cursor-pointer hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
									Switch
								</button>
							)}
							<Link
								href="/"
								className="flex items-center gap-1.5 px-3 py-0.5 text-sm rounded cursor-pointer hover:opacity-70 transition-opacity active:scale-97 duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
								<IconArrowLeft size={15} aria-hidden />
								Home
							</Link>
						</div>
					</div>

					{/* Mobile: just show Home link as pill */}
					<div className="md:hidden flex items-center">
						<Link
							href="/"
							className="bg-background text-foreground rounded-xl px-3 py-1.5 text-sm flex items-center gap-1.5 active:scale-97 duration-300 select-none">
							<IconArrowLeft size={15} aria-hidden />
							Home
						</Link>
					</div>
				</div>
			</header>

			{/* Mobile bottom nav */}
			<nav
				className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-foreground/10 flex"
				aria-label="Mobile navigation">
				{NAV.map(({ href, label, Icon }) => {
					const active = pathname === href;
					return (
						<Link
							key={href}
							href={href}
							className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 font-mono text-[8px] tracking-widest uppercase transition-colors ${
								active ? "text-accent" : "text-foreground/30 hover:text-foreground/55"
							}`}>
							<Icon size={17} />
							{label}
						</Link>
					);
				})}
			</nav>
		</>
	);
}
