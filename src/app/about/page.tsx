import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About the bad idea lab",
  description:
    "ifXBuiltY is a tiny comedy lab for satirical AI UI screenshots: mix brands, invent products nobody asked for, and browse the community's evidence.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl font-black tracking-tight text-ink md:text-5xl">
        About
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-subtle">
        ifXBuiltY asks a simple question: what if one company built another company&apos;s product?
        Pick a builder and a target, describe the vibe, and get a satirical UI screenshot — then share
        it and vote.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-subtle">
        It&apos;s part creative toy, part commentary, and part feed of alternate timelines. Have fun,
        don&apos;t impersonate real products maliciously, and tip your hat to the brands you spoof.
      </p>
      <Link
        href="/generate"
        className="mt-10 inline-flex rounded-full bg-ink px-6 py-3 font-display text-base font-black italic text-chrome transition-opacity hover:opacity-90"
      >
        Try the generator →
      </Link>
    </div>
  );
}
