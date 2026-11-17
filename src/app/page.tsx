import Link from "next/link";
import DrunkTitle from "@/components/home/DrunkTitle";
import HeroFooter from "@/components/HeroFooter";
import { BorderBeam, Particles } from "@/components/magic/effects";

const models = [
  {
    number: "01",
    label: "LATEST RELEASE · PHC-1",
    title: "Purcar HexoChem 1",
    description:
      "The newest released Purcar model. Explore chemistry across organic and inorganic examples, with all 118 elements represented.",
    href: "/studio",
    action: "Open HexoChem Studio",
    className: "model-card-featured",
  },
  {
    number: "02",
    label: "COMING SOON",
    title: "PurcarSF 1.0",
    description:
      "The Purcar language model line is coming back. More details will follow as the next release takes shape.",
    href: "#about",
    action: "Follow the project",
    className: "model-card-upcoming",
  },
];

export default function Home() {
  return (
    <>
      <main className="site-main home-minimal-main purcar-home">
        <section className="hero-minimal" aria-labelledby="home-title">
          <Particles className="hero-sky-particles" quantity={35} color="#ffffff" size={0.45} />
          <div className="hero-minimal-center">
            <span className="purcar-eyebrow"><i /> A SMALL PLAYGROUND FOR MODELS</span>
            <DrunkTitle />
            <p className="hero-minimal-desc">
              A fun little project where I test, explore, and share different models.
            </p>
            <div className="purcar-hero-actions">
              <Link className="purcar-primary-link" href="#models">
                Explore the models <span aria-hidden="true">↓</span>
              </Link>
              <Link className="purcar-secondary-link" href="/studio">
                Try PHC-1 in HexoChem Studio <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="hero-minimal-bottom">
            <div className="hero-strip purcar-model-strip" aria-label="Purcar models">
              <Link href="#models" className="strip-item"><span className="strip-num">01</span><span className="strip-label">PHC-1 · latest release</span></Link>
              <span className="strip-sep" aria-hidden="true">|</span>
              <Link href="#models" className="strip-item"><span className="strip-num">02</span><span className="strip-label">PurcarSF 1.0 · coming soon</span></Link>
            </div>
            <p className="hero-location">PURCAR MODEL PLAYGROUND</p>
          </div>
        </section>

        <section className="min-section purcar-section" id="models" aria-labelledby="models-title">
          <div className="min-section-head">
            <span className="min-kicker">01 / the models</span>
            <span className="purcar-section-aside">TESTED · SHARED · IN PROGRESS</span>
          </div>
          <div className="purcar-section-intro">
            <h2 id="models-title">A few models, and room for more.</h2>
            <p>Here’s what’s out and what’s on its way.</p>
          </div>
          <div className="purcar-model-grid purcar-hover-grid">
            {models.map((model) => (
              <article className={`purcar-model-card purcar-hover-card ${model.className}`} key={model.number}>
                <div className="purcar-hover-copy">
                  <div className="purcar-model-card-top">
                    <span>{model.label}</span>
                    <span>{model.number} / 01</span>
                  </div>
                  <h3>{model.title}</h3>
                  <h4 aria-hidden="true">{model.number === "01" ? "PHC-1 · Ready to explore" : "Purcar language model · In progress"}</h4>
                  <p>{model.description}</p>
                  <Link href={model.href} className="purcar-model-link">
                    {model.action} <span aria-hidden="true">→</span>
                  </Link>
                </div>
                {model.number === "01" ? (
                  <div className="purcar-hover-visual" aria-hidden="true">
                    <div className="purcar-hover-visual-glow" />
                    <div className="purcar-hover-orbit purcar-hover-orbit-one" />
                    <div className="purcar-hover-orbit purcar-hover-orbit-two" />
                    <div className="purcar-hover-logo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/media/hexochem-logo.webp" alt="" />
                    </div>
                    <span className="purcar-hover-code">PURCAR · PHC / 001</span>
                  </div>
                ) : (
                  <div className="purcar-upcoming-visual" aria-hidden="true">
                    <span>UP NEXT</span>
                    <strong>PurcarSF</strong>
                    <small>1.0 · COMING SOON</small>
                  </div>
                )}
                <BorderBeam className="purcar-model-beam" size={140} duration={12} colorFrom="#60a5fa" colorTo="#2563eb" />
              </article>
            ))}
          </div>
        </section>

        <section className="min-section purcar-section purcar-about" id="about" aria-labelledby="about-title">
          <div>
            <span className="min-kicker">04 / about purcar.me</span>
            <h2 id="about-title">Made for the fun of trying things.</h2>
          </div>
          <p>
            purcar.me is a small project where I test models, share the ones I release, and keep a home for whatever I build next. No big pitch—just experiments, updates, and models you can try.
          </p>
        </section>
      </main>

      <HeroFooter />
    </>
  );
}
