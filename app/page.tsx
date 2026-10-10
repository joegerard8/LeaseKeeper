"use client";

import { CSSProperties, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  FileText,
  KeyRound,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const obligations = [
  { task: "Certificate of insurance", tenant: "Northwind Dental", due: "Due Oct 01", tone: "amber" },
  { task: "Quarterly HVAC service", tenant: "Suite 210 · Veridian", due: "Due Oct 08", tone: "green" },
  { task: "Fire equipment inspection", tenant: "Harbor Market", due: "Due Oct 14", tone: "green" },
];

const platformFeatures = [
  {
    number: "01",
    icon: FileCheck2,
    title: "Lease intelligence",
    description: "Extract responsibilities, dates, rent schedules, and compliance requirements—with every item cited to its source clause.",
    details: ["Manager review before activation", "Recurring obligations", "Proof collection and escalation"],
  },
  {
    number: "02",
    icon: Wrench,
    title: "Maintenance & vendors",
    description: "Move requests from tenant intake to vendor assignment, invoice approval, and closeout in one accountable record.",
    details: ["Lease-aware responsibility guidance", "Approved vendor directory", "Quotes, work orders, and invoices"],
  },
  {
    number: "03",
    icon: CircleDollarSign,
    title: "Rent & tenant portal",
    description: "Give tenants a straightforward place to see charges, make payments, submit requests, and provide required documents.",
    details: ["Rent and invoice visibility", "Payment history", "Mobile-friendly tenant experience"],
  },
  {
    number: "04",
    icon: Landmark,
    title: "Property financials",
    description: "Keep receivables, recurring charges, vendor bills, and property-level reporting organized without an enterprise learning curve.",
    details: ["Rent rolls and recurring charges", "Delinquency tracking", "Accounting-ready records"],
  },
];

const steps = [
  { label: "Upload", title: "Add the executed lease", body: "LeaseKeeper reads the document and preserves the original source." },
  { label: "Review", title: "Approve what matters", body: "Confirm extracted dates, duties, evidence, and responsible parties." },
  { label: "Activate", title: "Put obligations to work", body: "Create tasks, reminders, requests, and escalation rules automatically." },
  { label: "Complete", title: "Close the loop", body: "Collect proof, maintain the audit trail, and schedule the next recurrence." },
];

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xbgjbnop";

async function submitToFormspree(formData: FormData) {
  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let message = "We couldn't send your request. Please try again.";

    try {
      const result = (await response.json()) as {
        errors?: Array<{ message?: string }>;
      };
      const formspreeMessage = result.errors
        ?.map((error) => error.message)
        .filter(Boolean)
        .join(" ");
      if (formspreeMessage) message = formspreeMessage;
    } catch {
      // Keep the friendly fallback when Formspree does not return JSON.
    }

    throw new Error(message);
  }
}

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<Record<string, string>>;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(
      context.registerTool(
        {
          name: "submit_interest_request",
          title: "Request LeaseKeeper information",
          description: "Complete the page's early-access request and show the same confirmation state as the visible form.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 1 },
              email: { type: "string", minLength: 3 },
            },
            required: ["name", "email"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input) {
            const request = input as { name?: unknown; email?: unknown };
            const name = typeof request.name === "string" ? request.name.trim() : "";
            const email = typeof request.email === "string" ? request.email.trim() : "";
            if (!name || !email.includes("@")) {
              throw new Error("A name and valid email address are required.");
            }
            const formData = new FormData();
            formData.append("name", name);
            formData.append("email", email);
            formData.append("source", "LeaseKeeper page assistant");
            await submitToFormspree(formData);
            setSubmitted(true);
            return { status: "received", email };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px" },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    setSubmitting(true);
    setSubmitError("");

    try {
      await submitToFormspree(new FormData(form));
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't send your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="LeaseKeeper home">
          <span className="brand-mark"><KeyRound size={17} strokeWidth={1.8} /></span>
          <span>LeaseKeeper</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
          <a href="#why">Why LeaseKeeper</a>
          <Link href="/sign-in">Sign in</Link>
          <a href="#contact" className="nav-cta">Request information <ArrowRight size={15} /></a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Lease-aware property operations</div>
          <h1>The lease should run the property.</h1>
          <p className="hero-lede">
            LeaseKeeper brings rent, maintenance, vendors, compliance, and commercial property financials into one disciplined system—then uses each lease to keep the right work moving.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#contact">Request Information <ArrowRight size={17} /></a>
            <a className="button button-secondary" href="#platform">Explore the platform</a>
          </div>
          <div className="hero-notes" aria-label="Product principles">
            <span><Check size={14} /> Built for commercial portfolios</span>
            <span><Check size={14} /> Human-reviewed lease intelligence</span>
          </div>
        </div>

        <div className="product-frame" aria-label="LeaseKeeper obligation dashboard preview">
          <div className="frame-bar">
            <div className="mini-brand"><Building2 size={15} /><span>Portfolio</span></div>
            <span className="sample-label">Product preview</span>
          </div>
          <div className="frame-body">
            <div className="frame-heading">
              <div>
                <span className="frame-kicker">COMPLIANCE</span>
                <h2>Portfolio obligations</h2>
              </div>
              <button type="button" aria-label="Upload a lease"><FileText size={15} /> Upload lease</button>
            </div>
            <div className="metric-row">
              <div><strong>24</strong><span>Open</span></div>
              <div><strong>7</strong><span>Due this month</span></div>
              <div><strong className="risk">2</strong><span>Need attention</span></div>
            </div>
            <div className="obligation-list">
              <div className="list-head"><span>Requirement</span><span>Due</span></div>
              {obligations.map((item) => (
                <div className="obligation" key={item.task}>
                  <span className={`status-dot ${item.tone}`} />
                  <div><strong>{item.task}</strong><span>{item.tenant}</span></div>
                  <time>{item.due}</time>
                </div>
              ))}
            </div>
            <div className="clause-link">
              <FileText size={18} />
              <div><span>Linked lease provision</span><strong>§ 8.2 · Insurance requirements</strong></div>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </section>

      <div className="trust-strip" data-reveal>
        <span>ONE SYSTEM</span>
        <strong>Lease intelligence</strong>
        <strong>Rent &amp; receivables</strong>
        <strong>Maintenance</strong>
        <strong>Tenant portal</strong>
      </div>

      <section className="thesis-section" id="why">
        <div className="section-index" data-reveal>THE PREMISE</div>
        <div className="thesis-copy" data-reveal>
          <h2>Property software stores the lease. LeaseKeeper puts it to work.</h2>
        </div>
        <div className="thesis-body" data-reveal>
          <p>
            Critical responsibilities should not stay buried in a PDF or depend on someone remembering a calendar entry. LeaseKeeper turns approved lease terms into visible, recurring operations.
          </p>
          <a href="#how-it-works">See the workflow <ArrowRight size={15} /></a>
        </div>
      </section>

      <section className="workflow-section" id="how-it-works">
        <div className="section-heading" data-reveal>
          <span>From signed document to completed work</span>
          <h2>A lease that stays active after the ink dries.</h2>
        </div>
        <div className="workflow-grid">
          {steps.map((step, index) => (
            <article
              className="workflow-step"
              data-reveal
              key={step.label}
              style={{ "--reveal-delay": `${index * 85}ms` } as CSSProperties}
            >
              <div className="step-top">
                <span>{step.label}</span>
                {index < steps.length - 1 && <ChevronRight size={16} />}
              </div>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
        <div className="example-flow" data-reveal aria-label="Example lease obligation workflow">
          <div className="example-clause">
            <span>LEASE · § 12.4</span>
            <blockquote>“Tenant shall maintain $2,000,000 in commercial general liability coverage and provide evidence annually.”</blockquote>
          </div>
          <div className="flow-rule"><span /></div>
          <div className="example-actions">
            <div><CalendarClock size={19} /><span><strong>Annual requirement</strong>Renewal scheduled</span></div>
            <div><MessageSquareText size={19} /><span><strong>Tenant reminder</strong>60, 30, and 7 days</span></div>
            <div><ShieldCheck size={19} /><span><strong>Evidence check</strong>Limits and expiration reviewed</span></div>
          </div>
        </div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-heading section-heading-light" data-reveal>
          <span>The complete platform</span>
          <h2>Everything needed to run a commercial portfolio—working together.</h2>
          <p>Lease intelligence is the foundation, not a separate add-on. It informs the everyday work across the entire property.</p>
        </div>
        <div className="feature-grid">
          {platformFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                className="feature-card"
                data-reveal
                key={feature.title}
                style={{ "--reveal-delay": `${Number(feature.number) % 2 * 90}ms` } as CSSProperties}
              >
                <div className="feature-meta"><span>{feature.number}</span><Icon size={24} strokeWidth={1.6} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul>
                  {feature.details.map((detail) => <li key={detail}><Check size={14} />{detail}</li>)}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="experience-section">
        <div className="experience-copy" data-reveal>
          <div className="eyebrow"><span /> Better for every party</div>
          <h2>Professional for your team. Simple for your tenants.</h2>
          <p>
            A property platform only works when people actually use it. LeaseKeeper gives managers the control they need without handing tenants another confusing enterprise portal.
          </p>
          <div className="audience-list">
            <div><Users size={20} /><span><strong>Property teams</strong>Portfolio-wide visibility and clear ownership</span></div>
            <div><Building2 size={20} /><span><strong>Tenants</strong>Payments, requests, and requirements in one place</span></div>
            <div><Wrench size={20} /><span><strong>Vendors</strong>Clear assignments, documents, and status updates</span></div>
          </div>
        </div>
        <div className="tenant-preview" data-reveal aria-label="Tenant portal preview">
          <div className="tenant-top">
            <div><span className="tenant-monogram">ND</span><span><strong>Northwind Dental</strong>Ridgeview Commons · Suite 110</span></div>
            <span className="account-chip">Tenant portal</span>
          </div>
          <div className="tenant-balance">
            <span>October balance</span>
            <strong>$8,420.00</strong>
            <button type="button">View statement</button>
          </div>
          <div className="tenant-tasks">
            <span className="task-label">ACTION REQUIRED</span>
            <div className="tenant-task">
              <ShieldCheck size={21} />
              <span><strong>Certificate of insurance</strong>Upload current proof of coverage by October 1</span>
              <ArrowRight size={17} />
            </div>
            <div className="tenant-task muted-task">
              <Wrench size={21} />
              <span><strong>Maintenance request #1048</strong>HVAC vendor visit scheduled for Tuesday</span>
              <span className="small-status">Scheduled</span>
            </div>
          </div>
        </div>
      </section>

      <section className="confidence-section">
        <div className="confidence-title" data-reveal>
          <span>CONTROL BY DESIGN</span>
          <h2>Intelligent assistance.<br />Human authority.</h2>
        </div>
        <div className="confidence-points" data-reveal>
          <div><ClipboardCheck size={22} /><p><strong>Review before activation</strong>AI suggests terms and responsibilities. A property manager confirms them before they drive work.</p></div>
          <div><FileText size={22} /><p><strong>Source-level traceability</strong>Every obligation stays connected to the original clause, page, property, and tenant.</p></div>
          <div><ShieldCheck size={22} /><p><strong>A complete audit history</strong>Approvals, notifications, evidence, changes, and completion remain visible in one record.</p></div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy" data-reveal>
          <span>EARLY ACCESS</span>
          <h2>Help shape a better way to manage commercial property.</h2>
          <p>
            We are speaking with commercial landlords and property managers who want fewer spreadsheets, fewer missed obligations, and a better experience for their tenants.
          </p>
          <div className="contact-note"><BadgeDollarSign size={19} /><span><strong>No commitment.</strong> Tell us about your portfolio and we will share product updates and pilot details.</span></div>
        </div>

        <div className="form-shell" data-reveal>
          {submitted ? (
            <div className="success-state" role="status">
              <CheckCircle2 size={38} />
              <span>REQUEST RECEIVED</span>
              <h3>Thank you for your interest.</h3>
              <p>We have recorded your request and will keep you informed as LeaseKeeper develops.</p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setSubmitError("");
                }}
              >
                Submit another response
              </button>
            </div>
          ) : (
            <form action={FORMSPREE_ENDPOINT} method="POST" onSubmit={handleSubmit}>
              <input type="hidden" name="_subject" value="New LeaseKeeper information request" />
              <input className="form-honeypot" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
              <div className="form-heading">
                <span>Request information</span>
                <p>Fields marked with * are required.</p>
              </div>
              <div className="form-grid">
                <label>
                  Name *
                  <Input required disabled={submitting} name="name" autoComplete="name" placeholder="Your full name" />
                </label>
                <label>
                  Work email *
                  <Input required disabled={submitting} name="email" type="email" autoComplete="email" placeholder="you@company.com" />
                </label>
                <label>
                  Company
                  <Input disabled={submitting} name="company" autoComplete="organization" placeholder="Company name" />
                </label>
                <label>
                  Portfolio size
                  <Select disabled={submitting} name="portfolio">
                    <SelectTrigger className="form-select" aria-label="Portfolio size"><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent className="select-content">
                      <SelectItem value="1-10">1–10 leases</SelectItem>
                      <SelectItem value="11-50">11–50 leases</SelectItem>
                      <SelectItem value="51-200">51–200 leases</SelectItem>
                      <SelectItem value="201-plus">201+ leases</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <label className="message-field">
                What is hardest about your current process?
                <Textarea disabled={submitting} name="message" placeholder="Lease obligations, maintenance coordination, tenant payments..." />
              </label>
              {submitError && <p className="form-error" role="alert">{submitError}</p>}
              <Button type="submit" disabled={submitting} className="submit-button">
                {submitting ? "Sending request…" : "Request information"}
                {!submitting && <ArrowRight size={16} />}
              </Button>
              <p className="privacy-note">Your information will only be used to contact you about LeaseKeeper.</p>
            </form>
          )}
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark"><KeyRound size={17} strokeWidth={1.8} /></span>
          <span>LeaseKeeper</span>
        </a>
        <p>Lease-aware commercial property management.</p>
        <span>© 2026 LeaseKeeper</span>
      </footer>
    </main>
  );
}
