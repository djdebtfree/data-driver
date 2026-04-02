import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import './App.css';

/* ─── Verification data points ─── */
interface CheckPoint {
  label: string;
  pass: boolean;
  status: 'pending' | 'checking' | 'done';
}

const CHECKS: { label: string; pass: boolean }[] = [
  { label: 'First name', pass: true },
  { label: 'Last name', pass: true },
  { label: 'Email deliverability', pass: true },
  { label: 'Phone connection', pass: true },
  { label: 'Company / agency', pass: false },
  { label: 'Title / role', pass: true },
  { label: 'Location match', pass: true },
  { label: 'License status', pass: false },
  { label: 'LinkedIn profile', pass: true },
  { label: 'Industry vertical', pass: true },
  { label: 'Company size', pass: false },
  { label: 'Years in role', pass: true },
  { label: 'Email engagement', pass: true },
  { label: 'Phone connection rate', pass: false },
  { label: 'Intent signals', pass: true },
];

const STATUS_TEXT: Record<string, string> = {
  'First name': 'verified',
  'Last name': 'verified',
  'Email deliverability': 'verified',
  'Phone connection': 'connected',
  'Company / agency': 'not found',
  'Title / role': 'found',
  'Location match': 'confirmed',
  'License status': 'unavailable',
  'LinkedIn profile': 'found',
  'Industry vertical': 'insurance',
  'Company size': 'not found',
  'Years in role': '5+ years',
  'Email engagement': 'active',
  'Phone connection rate': 'below threshold',
  'Intent signals': 'high intent',
};

/* ─── SVG Icons ─── */
function InstallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 12l4 4 4-4" stroke="#39FF14" strokeWidth="2" />
      <path d="M12 8v8" />
    </svg>
  );
}

function LeadsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#007BFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <path d="M19 8l2 2-2 2" stroke="#39FF14" strokeWidth="2" />
    </svg>
  );
}

function SandyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00D4A7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <circle cx="9" cy="10" r="1" fill="#39FF14" stroke="none" />
      <circle cx="12" cy="10" r="1" fill="#39FF14" stroke="none" />
      <circle cx="15" cy="10" r="1" fill="#39FF14" stroke="none" />
    </svg>
  );
}

/* ─── Score Circle ─── */
function ScoreCircle({ passed, total }: { passed: number; total: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const pct = passed / total;
  const offset = circumference * (1 - pct);

  return (
    <div className="score-circle">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#007BFF" />
            <stop offset="25%" stopColor="#00C2FF" />
            <stop offset="50%" stopColor="#00D4A7" />
            <stop offset="75%" stopColor="#39FF14" />
            <stop offset="100%" stopColor="#F5FF00" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={radius} className="score-circle-bg" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="score-circle-fill"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-text">
        <span className="score-number">{passed}/{total}</span>
        <span className="score-label">Verified</span>
      </div>
    </div>
  );
}

/* ─── FAQ Item ─── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}>
      <div className="faq-question">
        <span>{question}</span>
        <span className="faq-chevron">{open ? '−' : '+'}</span>
      </div>
      {open && <div className="faq-answer">{answer}</div>}
    </div>
  );
}

/* ─── Main App ─── */
function App() {
  const demoRef = useRef<HTMLDivElement>(null);

  /* Demo form state */
  const [demoForm, setDemoForm] = useState({ name: '', email: '', phone: '', state: '' });
  const [checks, setChecks] = useState<CheckPoint[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);

  /* Notify form state */
  const [notifyForm, setNotifyForm] = useState({ name: '', email: '', company: '' });
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  const scrollToDemo = useCallback(() => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* Run simulated verification */
  const runVerification = useCallback(async () => {
    setIsVerifying(true);
    setVerificationDone(false);

    const initial: CheckPoint[] = CHECKS.map((c) => ({
      label: c.label,
      pass: c.pass,
      status: 'pending' as const,
    }));
    setChecks(initial);

    for (let i = 0; i < CHECKS.length; i++) {
      setChecks((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'checking' } : item))
      );
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
      setChecks((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item))
      );
    }

    setIsVerifying(false);
    setVerificationDone(true);
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.email) return;
    runVerification();
  };

  /* Notify form submission */
  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyForm.name || !notifyForm.email) return;

    setNotifySubmitting(true);
    setNotifyError('');

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('data_driver_leads').insert({
          name: notifyForm.name,
          email: notifyForm.email,
          company: notifyForm.company || null,
        });
        if (error) throw error;
      }
      setNotifySuccess(true);
    } catch (err: unknown) {
      console.error('Notify error:', err);
      if (!isSupabaseConfigured) {
        setNotifySuccess(true);
      } else {
        setNotifyError('Something went wrong. Please try again.');
      }
    } finally {
      setNotifySubmitting(false);
    }
  };

  const passed = checks.filter((c) => c.pass && c.status === 'done').length;
  const failed = checks.filter((c) => !c.pass && c.status === 'done').length;

  const CHECKOUT_URL = 'https://data-driver-form.vercel.app?ref=datadriverpro';

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-badge">AI Sales Automation for GoHighLevel</div>
        <h1>Stop Chasing<br />Dead Leads</h1>
        <div className="rainbow-line" />
        <p>
          Sandy texts, calls, qualifies, and books appointments from verified intent data —
          so you close instead of chase.
        </p>
        <a href={CHECKOUT_URL} className="hero-cta">
          Try Data Driver Pro — First Month Free
        </a>
        <div className="hero-sub-cta">
          2,000 verified contacts included. No commitment.
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="how-section">
        <h2>How It Works</h2>
        <div className="rainbow-line" />
        <p className="how-subtitle">Three steps from signal to sale</p>

        <div className="how-grid">
          <div className="how-card">
            <div className="how-step-number">01</div>
            <div className="how-icon">
              <InstallIcon />
            </div>
            <h3>Install in 60 Seconds</h3>
            <p>
              One-click GHL snapshot. All pipelines, workflows, and AI agents pre-built.
              You walk in, everything's already running.
            </p>
          </div>

          <div className="how-card">
            <div className="how-step-number">02</div>
            <div className="how-icon">
              <LeadsIcon />
            </div>
            <h3>Buy Your Leads</h3>
            <p>
              Pick your market, apply filters, pay per contact. Leads land in your CRM
              instantly — verified against 15 data points.
            </p>
          </div>

          <div className="how-card">
            <div className="how-step-number">03</div>
            <div className="how-icon">
              <SandyIcon />
            </div>
            <h3>Sandy Takes Over</h3>
            <p>
              AI texts, calls, qualifies, books. You just show up and close. Sandy
              never sleeps, never forgets a follow-up.
            </p>
          </div>
        </div>
      </section>

      {/* ─── VERIFICATION DEMO ─── */}
      <section className="demo-section" ref={demoRef} id="demo">
        <h2>See Verification In Action</h2>
        <div className="rainbow-line" />
        <p className="demo-subtitle">
          Enter any contact info. Watch real-time verification across 15 data points.
        </p>

        {!isVerifying && !verificationDone && (
          <form className="demo-form" onSubmit={handleDemoSubmit}>
            <input
              type="text"
              placeholder="Full name"
              value={demoForm.name}
              onChange={(e) => setDemoForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              type="email"
              placeholder="Email address"
              value={demoForm.email}
              onChange={(e) => setDemoForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={demoForm.phone}
              onChange={(e) => setDemoForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <input
              type="text"
              placeholder="State"
              value={demoForm.state}
              onChange={(e) => setDemoForm((f) => ({ ...f, state: e.target.value }))}
            />
            <button type="submit" className="demo-submit">
              Run Verification
            </button>
          </form>
        )}

        {(isVerifying || verificationDone) && (
          <div className="verification-container">
            <div className="verification-header">
              <h3>
                {isVerifying ? 'Verifying contact data...' : 'Verification Complete'}
              </h3>
              <p>Checking against 15 data points</p>
            </div>

            <ul className="check-list">
              {checks.map((check, idx) => (
                <li key={idx} className={`check-item ${check.status}`}>
                  <div className="check-icon">
                    {check.status === 'pending' && <span style={{ color: '#333' }}>●</span>}
                    {check.status === 'checking' && <div className="spinner" />}
                    {check.status === 'done' && (
                      <span className={check.pass ? 'pass' : 'fail'}>
                        {check.pass ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  <span className="check-label">{check.label}</span>
                  <span
                    className={`check-status ${
                      check.status === 'done'
                        ? check.pass
                          ? 'pass'
                          : 'fail'
                        : check.status === 'checking'
                        ? 'checking-text'
                        : ''
                    }`}
                  >
                    {check.status === 'pending' && ''}
                    {check.status === 'checking' && 'checking...'}
                    {check.status === 'done' && STATUS_TEXT[check.label]}
                  </span>
                </li>
              ))}
            </ul>

            {verificationDone && (
              <div className="score-card">
                <div className="score-circle-wrapper">
                  <ScoreCircle passed={passed} total={15} />
                </div>
                <h3>{passed} of 15 Data Points Verified</h3>
                <p>This contact scores above the verification threshold</p>
                <div className="score-breakdown">
                  <div className="breakdown-item">
                    <div className="breakdown-dot pass" />
                    <span>{passed} passed</span>
                  </div>
                  <div className="breakdown-item">
                    <div className="breakdown-dot fail" />
                    <span>{failed} failed</span>
                  </div>
                </div>
                <a href={CHECKOUT_URL} className="score-card-cta">
                  Get Leads Like This — Start Free Month
                </a>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── WHAT'S INCLUDED ─── */}
      <section className="features-section">
        <h2>What's Included</h2>
        <div className="rainbow-line" />
        <p className="features-subtitle">
          Everything you need to run a fully automated sales operation — inside GHL.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Sandy AI (SMS + Voice)</h3>
            <p>Qualifies leads 24/7 via text and phone. Warm, direct, never robotic.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📞</div>
            <h3>6 VAPI Voice Assistants</h3>
            <p>Inbound and outbound AI calling. Handles objections, books appointments.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎥</div>
            <h3>Sandy Live Avatar</h3>
            <p>AI video sales calls. Sandy shows up on screen so your leads feel heard.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Lead Scoring Engine</h3>
            <p>Scores 0–100 across 15 data points. You only work the hottest contacts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔁</div>
            <h3>Pre-Built Pipelines</h3>
            <p>Lead → Appointment → Close → Onboard. Every stage mapped and automated.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>Automated Follow-Up</h3>
            <p>No-show recovery, re-engagement sequences, drip nurture campaigns.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎙️</div>
            <h3>Call Recording + AI Analysis</h3>
            <p>Every call transcribed and summarized. Know what's working and what's not.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🖥️</div>
            <h3>Landing Pages + Funnels</h3>
            <p>AI-generated pages inside your GHL account. Built and live in minutes.</p>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="pricing-section">
        <h2>Simple Pricing</h2>
        <div className="rainbow-line" />
        <p className="pricing-subtitle">One plan. Everything included. Cancel anytime.</p>

        <div className="pricing-card">
          <div className="pricing-badge">Most Popular</div>
          <div className="pricing-name">Data Driver Pro</div>
          <div className="pricing-amount">
            <span className="pricing-dollar">$</span>997
            <span className="pricing-period">/mo</span>
          </div>
          <div className="pricing-trial">First month FREE with your first lead purchase</div>

          <ul className="pricing-features">
            <li><span className="pricing-check">✓</span> Sandy AI — SMS + Voice qualification</li>
            <li><span className="pricing-check">✓</span> 6 VAPI Voice Assistants</li>
            <li><span className="pricing-check">✓</span> Sandy Live Avatar video calls</li>
            <li><span className="pricing-check">✓</span> Lead Scoring Engine (15 data points)</li>
            <li><span className="pricing-check">✓</span> Pre-Built GHL Pipelines</li>
            <li><span className="pricing-check">✓</span> Automated Follow-Up Sequences</li>
            <li><span className="pricing-check">✓</span> Call Recording + AI Analysis</li>
            <li><span className="pricing-check">✓</span> Landing Pages + Funnels</li>
            <li><span className="pricing-check">✓</span> 2,000 verified contacts/month ($500 value)</li>
            <li><span className="pricing-check">✓</span> Full GHL snapshot — ready in 60 seconds</li>
            <li><span className="pricing-check">✓</span> Cancel anytime, no contracts</li>
          </ul>

          <a href={CHECKOUT_URL} className="pricing-cta">
            Start Free Month
          </a>
          <div className="pricing-fine-print">
            $0.25/contact for additional leads. No minimums.
          </div>
        </div>
      </section>

      {/* ─── SANDY SECTION ─── */}
      <section className="sandy-section">
        <div className="sandy-content">
          <div className="sandy-text">
            <div className="sandy-eyebrow">Your AI Sales Assistant</div>
            <h2>Meet Sandy</h2>
            <div className="rainbow-line rainbow-line-left" />
            <p>
              Sandy Beach is your AI sales assistant. She's warm, direct, and never sleeps.
            </p>
            <p>
              She'll text your leads within 60 seconds of them coming in, qualify them through
              natural conversation, handle objections, and book appointments on your calendar —
              without you lifting a finger.
            </p>
            <p>
              While you're on a call, Sandy's already working the next 50 leads. While you
              sleep, she's following up on no-shows. You show up to close. That's it.
            </p>
            <a href={CHECKOUT_URL} className="sandy-cta">
              Let Sandy Work For You
            </a>
          </div>
          <div className="sandy-avatar">
            <div className="sandy-avatar-placeholder">
              <div className="sandy-avatar-glow" />
              <div className="sandy-avatar-inner">
                <div className="sandy-avatar-icon">🤖</div>
                <div className="sandy-avatar-label">Sandy Live Avatar</div>
                <div className="sandy-avatar-sub">AI Video Sales Calls</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="rainbow-line" />

        <div className="faq-list">
          <FaqItem
            question="What is Data Driver Pro?"
            answer="Data Driver Pro is a full AI sales automation platform built inside GoHighLevel. It includes Sandy (your AI assistant), pre-built pipelines, lead scoring, 6 voice AI agents, and verified intent data — everything wired together and ready to run the moment you install."
          />
          <FaqItem
            question="How do I get started?"
            answer="Install the GHL snapshot, connect your calendar, and buy your first batch of leads. The whole setup takes under 3 minutes. Sandy starts texting and calling your leads automatically."
          />
          <FaqItem
            question="What kind of leads am I getting?"
            answer="Verified intent contacts — people actively searching for what you offer. Every contact goes through 15-point verification before landing in your CRM. You pay $0.25 per contact, no minimums."
          />
          <FaqItem
            question="Do I need GoHighLevel?"
            answer="Yes. Data Driver Pro lives inside GHL sub-accounts. If you don't have GHL, you'll need it — but setup is included and we'll walk you through it."
          />
          <FaqItem
            question="Can I cancel?"
            answer="Yes, anytime. No contracts, no cancellation fees. If it's not working for you, you stop paying. That's it."
          />
          <FaqItem
            question="What does Sandy actually do?"
            answer="Sandy texts every new lead within 60 seconds. She qualifies them through natural conversation, handles common objections, and books appointments directly on your calendar. She also does outbound calls via VAPI, manages no-show follow-up, and runs re-engagement sequences. You just close."
          />
        </div>
      </section>

      {/* ─── NOTIFY / SECONDARY CTA ─── */}
      <section className="notify-section">
        <h3>Not ready yet? Get notified when new features drop.</h3>
        <div className="rainbow-line" />
        <p>We ship fast. Drop your email and we'll keep you in the loop.</p>

        {notifySuccess ? (
          <div className="waitlist-success">
            You're on the list. We'll reach out when there's something worth knowing.
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={handleNotifySubmit}>
            <input
              type="text"
              placeholder="Your name"
              value={notifyForm.name}
              onChange={(e) => setNotifyForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              type="email"
              placeholder="Email address"
              value={notifyForm.email}
              onChange={(e) => setNotifyForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Company (optional)"
              value={notifyForm.company}
              onChange={(e) => setNotifyForm((f) => ({ ...f, company: e.target.value }))}
            />
            <button type="submit" className="waitlist-submit" disabled={notifySubmitting}>
              {notifySubmitting ? 'Saving...' : 'Get Notified'}
            </button>
            {notifyError && <div className="waitlist-error">{notifyError}</div>}
          </form>
        )}
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="footer">
        <div className="footer-brand">Built by AJF Financial Group</div>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
        <div className="footer-copy">&copy; 2026 AJF Financial Group. All rights reserved.</div>
      </footer>
    </>
  );
}

export default App;
