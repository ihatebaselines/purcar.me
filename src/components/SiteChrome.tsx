"use client";

import Link from "next/link";
import { HomeIcon, FlaskConical } from "lucide-react";
import { Dock, DockIcon } from "@/components/magic/ui";

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-[11px] text-background opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

const linkCls = "flex size-full items-center justify-center rounded-full text-fg transition hover:bg-fg/10";

export function SiteChrome() {
  return (
    <>
      <header className="site-chrome-header sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex min-h-[64px] max-w-[1560px] items-center justify-between gap-4 px-5">
          <Link href="/" className="flex items-center gap-2.5 text-base font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/hexochem-logo.webp" alt="HexoChem" className="size-7 rounded-md border border-border bg-white object-cover" />
            <span>purcar.me<span className="text-accent">.</span></span>
            <span className="rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">MODEL PLAYGROUND</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted">
            <Link href="/" className="transition hover:text-fg">overview</Link>
            <Link href="/#models" className="hidden transition hover:text-fg sm:inline">models</Link>
            <Link href="/#about" className="hidden transition hover:text-fg sm:inline">about</Link>
            <Link href="/studio" className="font-semibold text-accent transition hover:text-fg">studio</Link>
          </nav>
        </div>
      </header>

      <div className="site-dock fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <Dock>
          <DockIcon><Tip label="Home"><Link href="/" aria-label="Home" className={linkCls}><HomeIcon className="size-4" /></Link></Tip></DockIcon>
          <DockIcon><Tip label="HexoChem Studio"><Link href="/studio" aria-label="Studio" className={linkCls}><FlaskConical className="size-4 text-accent" /></Link></Tip></DockIcon>
          <div className="mx-1 h-8 w-px bg-border" />
        </Dock>
      </div>
    </>
  );
}
