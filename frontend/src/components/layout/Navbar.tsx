import ScrollLink from "@/components/ScrollLink";
import {
	IconLogin2,
	IconShieldDollar,
	IconUserPlus,
} from "@tabler/icons-react";
import Link from "next/link";

export default function Navbar() {
	return (
		<header className="fixed top-4 left-4 right-4 z-999">
			<div className="max-w-4xl mx-auto bg-foreground/80 backdrop-blur-md text-background pl-6 pr-1.5 py-1.5 rounded-2xl flex items-center justify-between gap-8">
				<Link
					href={"/"}
					className="text-2xl flex items-center select-none active:scale-97 duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
					Shift
					<IconShieldDollar
						color="#00aaff"
						aria-hidden="true"
					/>
					<span className="text-accent">hield</span>
				</Link>
				<nav aria-label="Main navigation">
					<div className="absolute top-1/2 left-1/2 -translate-1/2 flex items-center justify-center gap-6">
						<ScrollLink
							href="#problem"
							className="text-sm hover:opacity-70 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1">
							Problem
						</ScrollLink>
						<ScrollLink
							href="#how"
							className="text-sm hover:opacity-70 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1">
							How It Works
						</ScrollLink>
						<ScrollLink
							href="#pillars"
							className="text-sm hover:opacity-70 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1">
							Differentiators
						</ScrollLink>
						<ScrollLink
							href="#market"
							className="text-sm hover:opacity-70 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1">
							Market
						</ScrollLink>
					</div>
				</nav>
				<div className="flex items-center justify-center gap-2 bg-background text-foreground rounded-xl pl-4 p-1">
					<button className="flex items-center gap-1 cursor-pointer active:scale-97 duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
						<IconUserPlus
							size={18}
							aria-hidden="true"
						/>
						Sign Up
					</button>
					<button className="bg-foreground text-background rounded-[0.55rem] px-4 py-1.5 flex items-center gap-1 cursor-pointer active:scale-97 duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
						<IconLogin2
							size={18}
							aria-hidden="true"
						/>
						Log In
					</button>
				</div>
			</div>
		</header>
	);
}
