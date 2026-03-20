"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
	{ num: "15M+", label: "Gig Riders in India" },
	{ num: "₹0", label: "Current Coverage Available" },
	{ num: "40%", label: "Daily Income Lost" },
	{ num: "₹5", label: "Cost to Cover a Shift" },
];

export default function Home_2() {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			gsap.from(".stat-item", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.65,
				ease: "power2.out",
				scrollTrigger: {
					trigger: containerRef.current,
					start: "top 80%",
				},
			});
		},
		{ scope: containerRef },
	);

	return (
		<section
			ref={containerRef}
			className="px-4 md:px-10 pb-4">
			<div className="container mx-auto max-w-6xl">
				<div className="rounded-3xl bg-foreground text-background px-10 md:px-16 py-12 md:py-14">
					<div className="flex items-start divide-x divide-background/10">
						{stats.map((s, i) => (
							<div
								key={i}
								className="stat-item flex-1 px-8 first:pl-0 last:pr-0">
								<div className="font-sans font-black text-5xl md:text-7xl leading-none text-accent tracking-tight">
									{s.num}
								</div>
								<div className="font-mono text-[9px] text-background/35 tracking-widest uppercase mt-4 leading-snug">
									{s.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
