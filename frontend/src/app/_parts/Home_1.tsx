"use client";
import { useGSAP } from "@gsap/react";
import {
	IconArrowRight,
	IconChevronRight,
	IconShieldCheck,
} from "@tabler/icons-react";
import ScrollLink from "@/components/ScrollLink";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";

gsap.registerPlugin(SplitText);

const DISRUPTIONS = ["rain", "flooding", "bandh", "curfew", "strikes"];

export default function Home_1() {
	const containerRef = useRef<HTMLDivElement>(null);
	const wordRef = useRef<HTMLSpanElement>(null);
	const stopsRef = useRef<HTMLSpanElement>(null);

	useGSAP(
		() => {
			const prefersReduced = window.matchMedia(
				"(prefers-reduced-motion: reduce)"
			).matches;

			if (prefersReduced) {
				gsap.set(
					[".hero-eyebrow", ".hero-line", ".hero-sub", ".hero-cta", ".hero-visual"],
					{ opacity: 1, y: 0, scale: 1, clipPath: "none" }
				);
			} else {
				// ── Initial states ────────────────────────────────────────────
				gsap.set(".hero-visual", {
					opacity: 0,
					x: 50,
					rotationY: -18,
					transformPerspective: 900,
				});
				gsap.set([".ring-1", ".ring-2", ".ring-3"], { scale: 0, opacity: 0 });
				gsap.set(".hero-eyebrow", { opacity: 0, y: 14 });
				gsap.set(".hero-line", { clipPath: "inset(0 100% 0 0 round 4px)" });
				gsap.set(".hero-sub", { opacity: 0, y: 14 });
				gsap.set(".hero-cta", { opacity: 0, y: 14 });

				// ── Intro timeline (absolute positions for tight overlap) ─────
				const tl = gsap.timeline();

				// Card swoops in from the right with 3D perspective
				tl.to(".hero-visual", {
					opacity: 1,
					x: 0,
					rotationY: 0,
					duration: 1.1,
					ease: "power3.out",
				}, 0)
				// Rings pop in sequentially with bounce
				.to(".ring-1", { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.5)" }, 0.3)
				.to(".ring-2", { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.5)" }, 0.5)
				.to(".ring-3", { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.5)" }, 0.7)
				// Eyebrow
				.to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.65)
				// Headline lines wipe in left→right via clipPath
				.to(".hero-line", {
					clipPath: "inset(0 0% 0 0 round 4px)",
					duration: 0.75,
					stagger: 0.18,
					ease: "power3.inOut",
				}, 0.9)
				// Sub + CTA
				.to(".hero-sub", { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 1.85)
				.to(".hero-cta", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.15);

				// ── Idle loops (start after intro settles ~3s) ────────────────
				// Radar rings pulse outward
				gsap.fromTo(
					".ring-1",
					{ scale: 1, opacity: 0.65 },
					{ scale: 1.4, opacity: 0, duration: 2.6, repeat: -1, ease: "expo.out", delay: 3.2 }
				);
				gsap.fromTo(
					".ring-2",
					{ scale: 1, opacity: 0.5 },
					{ scale: 1.4, opacity: 0, duration: 2.9, repeat: -1, ease: "expo.out", delay: 4.0 }
				);
				gsap.fromTo(
					".ring-3",
					{ scale: 1, opacity: 0.35 },
					{ scale: 1.4, opacity: 0, duration: 3.2, repeat: -1, ease: "expo.out", delay: 4.8 }
				);

				// Card 3D tilt + float
				gsap.set(".card-inner", { transformPerspective: 600 });
				gsap.to(".card-inner", {
					rotationY: 5,
					rotationX: -4,
					duration: 4.0,
					repeat: -1,
					yoyo: true,
					ease: "sine.inOut",
					delay: 3.0,
				});
				gsap.to(".card-inner", {
					y: -9,
					duration: 2.8,
					repeat: -1,
					yoyo: true,
					ease: "sine.inOut",
					delay: 3.2,
				});

				// Shield icon breathing pulse
				gsap.to(".shield-icon", {
					scale: 1.14,
					duration: 1.9,
					repeat: -1,
					yoyo: true,
					ease: "sine.inOut",
				});

				// ── Word cycling ──────────────────────────────────────────────
				const span = wordRef.current!;
				span.style.display = "inline-block";
				span.textContent = DISRUPTIONS[0];

				let idx = 0;
				const cycleWord = () => {
					idx = (idx + 1) % DISRUPTIONS.length;
					const newWord = DISRUPTIONS[idx];
					const prevWidth = span.getBoundingClientRect().width;

					const splitOut = new SplitText(span, { type: "chars" });
					gsap.to([...splitOut.chars].reverse(), {
						opacity: 0,
						y: -7,
						stagger: 0.028,
						duration: 0.13,
						ease: "power2.in",
						onComplete: () => {
							splitOut.revert();
							span.textContent = newWord;
							const newWidth = span.getBoundingClientRect().width;
							const delta = newWidth - prevWidth;

							gsap.set(stopsRef.current, { x: -delta });
							gsap.to(stopsRef.current, {
								x: 0,
								duration: 0.42,
								ease: "power2.inOut",
							});

							const splitIn = new SplitText(span, { type: "chars" });
							gsap.from(splitIn.chars, {
								opacity: 0,
								y: 9,
								stagger: 0.045,
								duration: 0.22,
								ease: "back.out(1.7)",
								delay: 0.05,
								onComplete: () => splitIn.revert(),
							});
						},
					});
					gsap.delayedCall(2.8, cycleWord);
				};
				gsap.delayedCall(2.8, cycleWord);
			}
		},
		{ scope: containerRef }
	);

	return (
		<section
			ref={containerRef}
			aria-label="Hero"
			className="min-h-screen flex items-center px-4 md:px-10 pt-28 pb-16 overflow-hidden"
		>
			<div className="container mx-auto max-w-6xl">
				<div className="flex items-center gap-8 justify-between">
					{/* Left */}
					<div className="flex-1 flex flex-col gap-10">
						<span className="hero-eyebrow inline-flex items-center gap-2 w-fit font-mono text-xs tracking-widest uppercase border border-foreground/20 rounded-full px-4 py-1.5 text-foreground/50">
							<span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
							Predictive Parametric Micro-Insurance
						</span>

						<h1 className="flex flex-col gap-1">
							<span className="hero-line font-sans text-[clamp(3.5rem,8vw,7rem)] font-black leading-[0.92] tracking-tight">
								1 tap.
							</span>
							<span className="hero-line font-sans text-[clamp(3.5rem,8vw,7rem)] font-black leading-[0.92] tracking-tight">
								0 claims.
							</span>
							<span className="hero-line font-sans text-[clamp(2rem,4.5vw,4rem)] font-light leading-[1.1] tracking-tight text-foreground/45">
								money before{" "}<span className="whitespace-nowrap">the{" "}
								<span
									ref={wordRef}
									className="inline-block whitespace-nowrap text-foreground font-normal"
								>
									{DISRUPTIONS[0]}
								</span>{" "}
								<span ref={stopsRef} className="inline-block">stops.</span></span>
							</span>
						</h1>

						<p className="hero-sub text-base text-foreground/55 max-w-[420px] leading-relaxed">
							ShiftShield covers delivery partners{" "}
							<strong className="text-foreground font-semibold">before</strong>{" "}
							disruption hits — not after. Pincode-level precision. One tap.
							Money arrives before the rain stops.
						</p>

						<div className="hero-cta flex items-center gap-5 flex-wrap">
							<ScrollLink
								href="#how"
								className="primary-btn text-sm px-5 py-2 gap-2"
							>
								See How It Works
								<IconChevronRight size={15} aria-hidden="true" />
							</ScrollLink>
							<ScrollLink
								href="#pillars"
								className="flex items-center gap-1.5 text-sm text-foreground/55 hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
							>
								Our Differentiators
								<IconArrowRight size={14} aria-hidden="true" />
							</ScrollLink>
						</div>
					</div>

					{/* Right visual */}
					<div className="hero-visual flex-1 hidden md:flex items-center justify-center" aria-hidden="true">
						<div className="relative w-64 h-64">
							<div className="ring-1 absolute inset-0 rounded-full border-2 border-foreground/40" />
							<div className="ring-2 absolute -inset-8 rounded-full border-2 border-foreground/30" />
							<div className="ring-3 absolute -inset-16 rounded-full border-2 border-foreground/20" />
							<div className="card-inner absolute inset-8 rounded-2xl bg-foreground text-background flex flex-col items-center justify-center gap-3 shadow-2xl">
								<IconShieldCheck size={32} className="shield-icon text-accent" aria-hidden="true" />
								<div className="text-center">
									<div className="font-black text-3xl leading-none">₹5</div>
									<div className="font-mono text-[9px] text-background/40 tracking-widest mt-1.5 uppercase">
										per shift
									</div>
								</div>
								<div className="w-16 h-px bg-background/10" />
								<div className="font-mono text-[9px] text-background/30 tracking-wider uppercase">
									Active Coverage
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
