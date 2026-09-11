"use client";

import dynamic from "next/dynamic";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Globe2,
  Menu,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const ParticleGlobe = dynamic(() => import("@/components/ParticleGlobe"), {
  ssr: false,
  loading: () => null,
});

const clients = [
  "AMWELL",
  "Red Hat",
  "SANTANDER",
  "RACKSPACE",
  "VIACOM",
  "HP",
  "HYATT",
  "SUN CHEMICAL",
  "ZIPARI",
  "ACD",
];
const domains = [
  "Generative AI",
  "Data",
  "Cloud",
  "Cybersecurity",
  "Software",
  "Product Engineering",
];
const reasons = [
  ["AI + EI", "Technology and real human judgment on every hire, not one or the other."],
  ["Guaranteed quality", "Four-stage vetting and a standard 2-week no-risk trial on every hire."],
  ["Truly global scale", "A 14M+ network, far beyond typical regional talent pools."],
  ["Speed", "Vetted profiles in as little as 72 hours."],
  ["A dedicated partner", "A real point of contact who owns your outcome, not a self-serve queue."],
];

function Spark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`spark ${className}`}>
      ✦
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <Spark /> {children}
    </p>
  );
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="section-head">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

function LivingNetwork({ quiet = false }: { quiet?: boolean }) {
  const dots = Array.from({ length: quiet ? 48 : 72 }, (_, i) => ({
    left: `${(i * 37 + 7) % 96}%`,
    top: `${(i * 53 + 11) % 91}%`,
    delay: `${(i % 12) * -0.35}s`,
    size: i % 9 === 0 ? "node node-lg" : "node",
  }));
  return (
    <div className={`network ${quiet ? "network-quiet" : ""}`} aria-hidden="true">
      <div className="network-grid" />
      {dots.map((dot, i) => (
        <i
          key={i}
          className={dot.size}
          style={{ left: dot.left, top: dot.top, animationDelay: dot.delay }}
        />
      ))}
      {!quiet && (
        <>
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <div className="profile-card profile-one">
            <span>RK</span>
            <div>
              <b>Riya K.</b>
              <small>AI Engineer · 96% match</small>
            </div>
            <Spark />
          </div>
          <div className="profile-card profile-two">
            <span>MT</span>
            <div>
              <b>Marco T.</b>
              <small>Data Lead · 94% match</small>
            </div>
            <Spark />
          </div>
          <div className="network-count">
            <strong>14M+</strong>
            <small>global professionals</small>
          </div>
        </>
      )}
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="nav-shell">
        <button className="wordmark" aria-label="Hyqoo home">
          <Spark />
          hyqoo
        </button>
        <nav aria-label="Main navigation" className={open ? "nav-links nav-open" : "nav-links"}>
          {["Platform", "Solutions", "Why Hyqoo", "Success Stories", "Company"].map((item, i) => (
            <button key={item}>
              {item}
              {i < 2 && <ChevronDown />}
            </button>
          ))}
        </nav>
        <Button className="gold-button nav-cta">
          Hire talent <ArrowRight />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="menu-button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
    </header>
  );
}

function PlatformDemo() {
  const [tab, setTab] = useState(0);
  const steps = [
    { name: "Match", text: "AI searches 14M+ experts and scores each for role fit." },
    { name: "Vet", text: "A configurable four-stage process identifies interview-ready talent." },
    { name: "Hire & manage", text: "Interviews, feedback, offer and onboarding—all in one view." },
  ];
  return (
    <div className="product-shell">
      <div className="product-top">
        <div className="product-brand">
          <Spark /> hyqoo / talent cloud
        </div>
        <span className="status">
          <i /> Live network
        </span>
      </div>
      <div className="product-body">
        <aside>
          <small>YOUR PIPELINE</small>
          {steps.map((step, i) => (
            <button className={tab === i ? "active" : ""} onClick={() => setTab(i)} key={step.name}>
              <span>0{i + 1}</span>
              {step.name}
            </button>
          ))}
        </aside>
        <div className="product-main">
          <div className="search-label">What role are you hiring for?</div>
          <div className="role-search">
            <Search />
            <span>Senior machine learning engineer</span>
            <Button size="sm" className="gold-button">
              Find talent
            </Button>
          </div>
          <div className="match-summary">
            <div>
              <small>{steps[tab].name.toUpperCase()}</small>
              <h3>{steps[tab].text}</h3>
            </div>
            <strong>{tab === 0 ? "3,284" : tab === 1 ? "[X%]" : "72h"}</strong>
          </div>
          <div className="candidate-list">
            {[
              ["AR", "Amara R.", "98%"],
              ["JK", "Jonas K.", "96%"],
              ["SM", "Sofia M.", "94%"],
            ].map((p, i) => (
              <div className="candidate" key={p[1]}>
                <span className="avatar">{p[0]}</span>
                <div>
                  <b>{p[1]}</b>
                  <small>
                    {i === 1 ? "ML Infrastructure" : i === 2 ? "Applied AI" : "Machine Learning"}
                  </small>
                </div>
                <em>{p[2]} match</em>
                <Spark />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <Header />
      <section className="hero hero-centered">
        <ParticleGlobe />
        <div className="hero-content hero-content-centered">
          <Eyebrow>AI + human intelligence</Eyebrow>
          <h1>Build pre-vetted global talent in days—on one AI platform.</h1>
          <p className="hero-lede">
            Hyqoo helps enterprises build high-performing global teams fast, pairing a powerful
            platform with real human judgment and a dedicated partner.
          </p>
          <p className="hero-body">
            Tell us the role. Our AI searches 14M+ professionals, our Talent Evangelists confirm the
            fit, and you review interview-ready experts in as little as 72 hours.
          </p>
          <div className="hero-actions">
            <Button size="lg" className="gold-button">
              Hire talent <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" className="outline-button">
              Explore the platform
            </Button>
          </div>
          <p className="micro">Backed by Collabera's 25 years and Fortune 500 relationships.</p>
        </div>
        <div className="scroll-cue">
          SCROLL TO EXPLORE <span />
        </div>
      </section>

      <section className="trust band">
        <p>Trusted by the enterprises you’re building to join.</p>
        <div className="logo-mask">
          <div className="logo-rail">
            {[...clients, ...clients].map((client, i) => (
              <span key={`${client}-${i}`}>{client}</span>
            ))}
          </div>
        </div>
        <small>
          Working with organisations across the Fortune 500 and Global 1000, through Collabera’s
          relationships.
        </small>
      </section>

      <section className="problem section light-section">
        <div className="container">
          <SectionHead
            eyebrow="The hiring gap"
            title="Hiring technical talent has stopped keeping up."
            body="Four pressures widen the gap between the talent you need and the talent you can actually get."
          />
          <div className="gap-chart" aria-hidden="true">
            <span className="chart-label demand-label">Demand</span>
            <span className="chart-label supply-label">Available talent</span>
            <svg viewBox="0 0 1000 230" preserveAspectRatio="none">
              <path
                className="gap-fill"
                d="M0,170 C260,148 560,110 1000,24 L1000,198 C600,190 280,184 0,170 Z"
              />
              <path className="demand-line" d="M0,170 C260,148 560,110 1000,24" />
              <path className="supply-line" d="M0,170 C320,178 640,184 1000,198" />
            </svg>
          </div>
          <div className="pressure-grid">
            {[
              [
                "01",
                "Time to fill",
                "2–3 months",
                "Every open role can cost around $500 a day in lost productivity.",
              ],
              ["02", "Quality of talent", "77%", "of companies struggle to find skilled workers."],
              ["03", "Talent availability", "68%", "struggle to fill niche roles."],
              ["04", "Talent experience", "56%", "higher engagement when people feel they belong."],
            ].map((x) => (
              <article key={x[1]}>
                <span>{x[0]}</span>
                <h3>{x[1]}</h3>
                <strong>{x[2]}</strong>
                <p>{x[3]}</p>
              </article>
            ))}
          </div>
          <p className="transition-copy">
            The problem isn’t effort. Hiring still runs across disconnected tools, inboxes and
            spreadsheets—with no one accountable for the outcome.
          </p>
        </div>
      </section>

      <section className="platform section">
        <div className="container">
          <SectionHead
            eyebrow="The platform"
            title="One platform to find, vet, hire and manage global talent."
            body="Not a shortlist service that hands over CVs and steps back. Hyqoo runs the whole hire—and a team owns the outcome with you."
          />
          <PlatformDemo />
        </div>
      </section>

      <section className="mind-heart section">
        <div className="mind-grid" aria-hidden="true">
          <div className="machine-shape">
            {Array.from({ length: 25 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="organic-shape">
            <span />
            <span />
            <span />
          </div>
          <Spark className="convergence" />
        </div>
        <div className="container">
          <SectionHead
            eyebrow="AI + EI"
            title="AI finds who can do the job. Our people confirm who will thrive."
            body="Skills make someone qualified. Communication, collaboration and working style make them right for your team."
          />
          <p className="wide-copy">
            The AI reads your requirement, searches the network and scores every candidate for role
            fit. Then our Talent Evangelists assess the human qualities an algorithm cannot—judging
            whether someone will add to the team you’re building.
          </p>
        </div>
      </section>

      <section className="vetting section light-section">
        <div className="container">
          <SectionHead
            eyebrow="Quality at scale"
            title="Only [X%] of applicants make it onto the platform."
            body="Every expert clears a rigorous, configurable four-stage vetting process before you ever see them."
          />
          <div className="funnel">
            <div className="funnel-dots">
              {Array.from({ length: 72 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            {[
              [
                "01",
                "AI screening",
                "14M+",
                "AI pre-screens the network and surfaces the strongest matches.",
              ],
              [
                "02",
                "Technical",
                "650+ tests",
                "Role-specific, proctored assessments prove technical depth.",
              ],
              [
                "03",
                "Soft skills",
                "360° view",
                "Communication, collaboration, personality and video assessment.",
              ],
              [
                "04",
                "Live interview",
                "[X%]",
                "A Hyqoo Talent Evangelist confirms the complete fit.",
              ],
            ].map((s, i) => (
              <article className="funnel-stage" key={s[1]}>
                <span>{s[0]}</span>
                <div>
                  <h3>{s[1]}</h3>
                  <p>{s[3]}</p>
                </div>
                <strong>{s[2]}</strong>
                {i === 3 && <Spark />}
              </article>
            ))}
          </div>
          <div className="proof-line">
            <Check /> More than 60% of submitted profiles advance to interview; more than 50% of
            interviews result in a hire.
          </div>
        </div>
      </section>

      <section className="speed section">
        <div className="container">
          <SectionHead
            eyebrow="Built for speed"
            title="Vetted experts in as little as 72 hours."
            body="The same rigour, at a pace traditional hiring can’t match."
          />
          <div className="speed-track">
            <div className="fast-line" />
            <div className="speed-points">
              {[
                ["24h", "Requirements discovery"],
                ["48h", "Opportunity mapping"],
                ["72h", "Team evaluation"],
              ].map((x) => (
                <div key={x[0]}>
                  <span>
                    <Clock3 />
                  </span>
                  <strong>{x[0]}</strong>
                  <p>{x[1]}</p>
                </div>
              ))}
            </div>
            <div className="traditional">
              <span>Traditional hiring</span>
              <div />
              <strong>2–3 months</strong>
            </div>
          </div>
          <div className="reach">
            <Globe2 />
            <p>Scale to 100+ positions within days, across</p>
            <strong>30+ countries</strong>
            <span>on 5 continents</span>
          </div>
        </div>
      </section>

      <section className="breadth section light-section">
        <div className="container">
          <SectionHead
            eyebrow="Expertise without borders"
            title="Whatever you’re building, however you want to build it."
            body="Expertise across six technical domains—and four ways to engage, from a single expert to a fully managed function."
          />
          <div className="breadth-layout">
            <div className="domain-grid">
              {domains.map((d, i) => (
                <article key={d}>
                  <div className={`constellation constellation-${i}`}>
                    {Array.from({ length: 7 }, (_, n) => (
                      <i key={n} />
                    ))}
                  </div>
                  <span>0{i + 1}</span>
                  <h3>{d}</h3>
                </article>
              ))}
            </div>
            <div className="models">
              <p>ENGAGEMENT MODELS</p>
              {[
                "Staff augmentation & teams",
                "Recruitment process outsourcing",
                "Managed recruitment services",
                "GCC enablement",
              ].map((m, i) => (
                <div key={m}>
                  <span>0{i + 1}</span>
                  <h3>{m}</h3>
                  <ArrowRight />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="why section">
        <div className="container">
          <div className="why-top">
            <SectionHead
              eyebrow="Why Hyqoo"
              title="The scale of a network. The care of a boutique."
            />
            <div className="scale-visual">
              <div className="mass">
                <strong>14M+</strong>
                {Array.from({ length: 100 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <div className="typical">
                <strong>~20K</strong>
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <small>Hyqoo global network</small>
              <small>Typical talent pool</small>
            </div>
          </div>
          <div className="reason-list">
            {reasons.map((r, i) => (
              <article key={r[0]}>
                <span>0{i + 1}</span>
                <h3>{r[0]}</h3>
                <p>{r[1]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="proof section">
        <div className="container">
          <SectionHead
            eyebrow="Measured impact"
            title="The results our clients measure—and the reason behind them."
          />
          <div className="metrics">
            {[
              ["75 → 37", "days to hire"],
              ["94%", "offer acceptance"],
              ["Zero", "compliance violations"],
              ["35%", "lower cost per hire"],
            ].map((m) => (
              <article key={m[1]}>
                <strong>{m[0]}</strong>
                <span>{m[1]}</span>
              </article>
            ))}
          </div>
          <div className="case-study">
            <div>
              <Eyebrow>Featured case study</Eyebrow>
              <h3>How a global consumer-health company halved its hiring time.</h3>
              <p>
                Hyqoo staffed an enterprise data and machine-learning programme across Latin
                America—combining cross-border reach with accountable delivery.
              </p>
              <Button variant="outline" className="outline-button">
                Read the success stories <ArrowRight />
              </Button>
            </div>
            <div className="mobility-map" aria-label="Abstract global talent mobility map">
              <Globe2 />
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`arc arc-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="closing">
        <LivingNetwork quiet />
        <div className="closing-content">
          <Eyebrow>Your next team is already here</Eyebrow>
          <h2>Start building your team today.</h2>
          <p>
            Tell us the role. We’ll bring the network, the intelligence and the people who make the
            match work.
          </p>
          <div className="role-prompt">
            <Search />
            <span>What role are you hiring for?</span>
          </div>
          <div className="hero-actions">
            <Button size="lg" className="gold-button">
              Hire talent <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" className="outline-button">
              Talk to a partner
            </Button>
          </div>
        </div>
      </section>

      <section className="talent-strip">
        <div>
          <Spark />
          <div>
            <h2>Looking for your next role instead?</h2>
            <p>
              Join a global network of 14M+ professionals and take your career wherever life goes.
            </p>
          </div>
        </div>
        <Button variant="ghost">
          Explore Hyqoo for talent <ArrowRight />
        </Button>
      </section>
      <footer>
        <div className="footer-main">
          <div className="footer-brand">
            <div className="wordmark">
              <Spark />
              hyqoo
            </div>
            <p>
              AI-powered global talent.
              <br />
              Human judgment at every step.
            </p>
          </div>
          {[
            ["PLATFORM", "How it works", "AI + EI", "Vetting", "Talent cloud"],
            ["SOLUTIONS", "Staff augmentation", "RPO", "Managed services", "GCC enablement"],
            ["COMPANY", "Why Hyqoo", "Success stories", "About", "Careers"],
          ].map((col) => (
            <div className="footer-col" key={col[0]}>
              <strong>{col[0]}</strong>
              {col.slice(1).map((x) => (
                <button key={x}>{x}</button>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 Hyqoo. All rights reserved.</span>
          <span>Privacy · Terms · Accessibility</span>
          <span>SOC 2 · ISO 27001</span>
        </div>
      </footer>
    </main>
  );
}
