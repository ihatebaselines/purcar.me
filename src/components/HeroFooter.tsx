"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, Mail } from "lucide-react";
import { Button } from "@/components/ui-layouts/button";
import { Github, Linkedin } from "@/components/ui-layouts/brand-icons";

const groups = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "About purcar.me", href: "/#about" },
      { label: "Model lineup", href: "/#models" },
    ],
  },
  {
    title: "What I do",
    links: [
      { label: "Latest release · PHC-1", href: "/#models" },
      { label: "HexoChem Studio", href: "/studio" },
    ],
  },
  {
    title: "Get in touch",
    links: [
      { label: "Email", href: "mailto:rusvlad1010@icloud.com" },
      { label: "GitHub", href: "https://github.com/ihatebaselines" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/vladandreirus" },
    ],
  },
];

export default function HeroFooter() {
  const [email, setEmail] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videoRef.current?.pause();
    }
  }, []);

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent("Updates from purcar.me");
    const body = encodeURIComponent(`Please add ${email} to updates from purcar.me.`);
    window.location.href = `mailto:rusvlad1010@icloud.com?subject=${subject}&body=${body}`;
  };

  return (
    <footer className="hero-footer" id="site-footer">
      <div className="hero-footer-cta-wrap">
        <div className="hero-footer-cta">
          <video ref={videoRef} className="hero-footer-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
            <source src="/media/gemini-generated-sky.mp4" type="video/mp4" />
          </video>
          <div className="hero-footer-cta-overlay">
            <span className="hero-footer-eyebrow">PURCAR.ME · OPEN TO IDEAS</span>
            <h2>Meet the latest Purcar model.</h2>
            <Button
              render={<a href="/studio" />}
              className="hero-footer-primary-button"
            >
              Try PHC-1 in the Studio
              <span className="hero-footer-button-icon"><ArrowRight /></span>
            </Button>
          </div>
        </div>
      </div>

      <div className="hero-footer-black-panel">
        <div className="hero-footer-content">
          <div className="hero-footer-main-grid">
            <div className="hero-footer-identity">
              <Link href="/" className="hero-footer-wordmark">purcar.me<span>.</span></Link>
              <p className="hero-footer-tagline">Model experiments, shared as they grow.</p>
              <div className="hero-footer-social-block">
                <h3>Connect</h3>
                <div className="hero-footer-socials">
                  <a href="https://github.com/ihatebaselines" aria-label="GitHub" target="_blank" rel="noreferrer"><Github /></a>
                  <a href="https://www.linkedin.com/in/vladandreirus" aria-label="LinkedIn" target="_blank" rel="noreferrer"><Linkedin /></a>
                  <a href="https://www.instagram.com/_rusuuu__" aria-label="Instagram" target="_blank" rel="noreferrer"><span>ig</span></a>
                  <a href="mailto:rusvlad1010@icloud.com" aria-label="Email"><Mail /></a>
                </div>
              </div>
            </div>

            <div className="hero-footer-newsletter">
              <span className="hero-footer-eyebrow">PURCAR MODEL UPDATES</span>
              <h3>There’s always another model to try.</h3>
              <p>Leave your email to start a conversation about Purcar models and releases.</p>
              <form className="hero-footer-email-form" onSubmit={handleSubscribe}>
                <label className="sr-only" htmlFor="footer-email">Your email address</label>
                <input
                  id="footer-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <Button type="submit" aria-label="Send email" className="hero-footer-send-button">
                  <ArrowRight />
                </Button>
              </form>
            </div>
          </div>

          <nav className="hero-footer-link-groups" aria-label="Footer navigation">
            {groups.map((group) => (
              <div className="hero-footer-link-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.links.map((link) => (
                  link.href.startsWith("http") ? (
                    <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                  ) : (
                    <Link key={link.label} href={link.href}>{link.label}</Link>
                  )
                ))}
              </div>
            ))}
          </nav>

          <div className="hero-footer-bottom">
            <Link href="/" className="hero-footer-bottom-brand">purcar.me</Link>
            <span>© {new Date().getFullYear()} purcar.me. All rights reserved.</span>
            <a className="hero-footer-top-link" href="#top">
              Back to top <span><ArrowUp /></span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
