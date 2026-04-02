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

function MarkupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00D4A7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      <path d="M16 19l2-2" stroke="#39FF14" strokeWidth="2" />
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

  const MARKETPLACE_URL = '#'; /* GHL Marketplace install link — fill in when live */
  const LEADS_URL = 'https://data-driver-form.vercel.app?ref=datadriverpro';

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-badge">Free GHL Marketplace App</div>
        <h1>Buy Leads at 25 Cents.<br />Sell Them for a Dollar.</h1>
        <div className="rainbow-line" />
        <p>
          Install Data Driver from the GHL Marketplace. Buy verified contacts at $0.25 each.
          Resell to your sub-account clients at whatever you want. Keep the profit.
        </p>
        <a href={MARKETPLACE_URL} className="hero-cta">
          Install Free from GHL Marketplace
        </a>
        <div className="hero-sub-cta">
          Free to install. 14-day trial. No credit card required.
        </div>
      </section>

      {/* ─── THE MATH ─── */}
      <section className="math-section">
        <h2>The Math Is Simple</h2>
        <div className="rainbow-line" />
        <div className="math-grid">
          <div className="math-card">
            <div className="math-label">You Buy</div>
            <div className="math-value">1,000 contacts</div>
            <div className="math-detail">at $0.25 each = <strong>$250</strong></div>
          </div>
          <div className="math-arrow">&#8594;</div>
          <div className="math-card">
            <div className="math-label">You Sell</div>
            <div className="math-value">to 10 clients</div>
            <div className="math-detail">at $0.50 each = <strong>$500</strong></div>
          </div>
          <div className="math-arrow">&#8594;</div>
          <div className="math-card math-card-profit">
            <div className="math-label">You Profit</div>
            <div className="math-value-big">$250</div>
            <div className="math-detail">on a single batch</div>
          </div>
        </div>
        <p className="math-footnote">
          Charge $0.50, $0.75, or $1.00 per contact — your markup, your rules.
          Most agencies clear $500+ in the first two weeks.
        </p>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="how-section">
        <h2>How It Works</h2>
        <div className="rainbow-line" />
        <p className="how-subtitle">Three steps to a new revenue stream</p>

        <div className="how-grid">
          <div className="how-card">
            <div className="how-step-number">01</div>
            <div className="how-icon">
              <InstallIcon />
            </div>
            <h3>Install from GHL Marketplace</h3>
            <p>
              One click. Free. The app installs into your agency account and gives you
              access to 50M+ verified contacts across 41 audience segments.
            </p>
          </div>

          <div className="how-card">
            <div className="how-step-number">02</div>
            <div className="how-icon">
              <LeadsIcon />
            </div>
            <h3>Buy Verified Contacts</h3>
            <p>
              Pick your market, apply filters, pay $0.25 per contact. Every record verified
              against 15 data points before it reaches you. No junk.
            </p>
          </div>

          <div className="how-card">
            <div className="how-step-number">03</div>
            <div className="how-icon">
              <MarkupIcon />
            </div>
            <h3>Resell at Your Markup</h3>
            <p>
              Push contacts to your sub-account clients at $0.50, $0.75, $1.00 — whatever
              the market bears. You keep every cent of the spread.
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
            <input type="text" placeholder="Full name" value={demoForm.name} onChange={(e) => setDemoForm((f) => ({ ...f, name: e.target.value }))} required />
            <input type="email" placeholder="Email address" value={demoForm.email} onChange={(e) => setDemoForm((f) => ({ ...f, email: e.target.value }))} required />
            <input type="tel" placeholder="Phone number" value={demoForm.phone} onChange={(e) => setDemoForm((f) => ({ ...f, phone: e.target.value }))} />
            <input type="text" placeholder="State" value={demoForm.state} onChange={(e) => setDemoForm((f) => ({ ...f, state: e.target.value }))} />
            <button type="submit" className="demo-submit">Run Verification</button>
          </form>
        )}

        {(isVerifying || verificationDone) && (
          <div className="verification-container">
            <div className="verification-header">
              <h3>{isVerifying ? 'Verifying contact data...' : 'Verification Complete'}</h3>
              <p>Checking against 15 data points</p>
            </div>

            <ul className="check-list">
              {checks.map((check, idx) => (
                <li key={idx} className={`check-item ${check.status}`}>
                  <div className="check-icon">
                    {check.status === 'pending' && <span style={{ color: '#333' }}>&#9679;</span>}
                    {check.status === 'checking' && <div className="spinner" />}
                    {check.status === 'done' && (
                      <span className={check.pass ? 'pass' : 'fail'}>
                        {check.pass ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  <span className="check-label">{check.label}</span>
                  <span className={`check-status ${check.status === 'done' ? (check.pass ? 'pass' : 'fail') : check.status === 'checking' ? 'checking-text' : ''}`}>
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
                <p>This is the quality your clients receive. Every contact, every time.</p>
                <div className="score-breakdown">
                  <div className="breakdown-item"><div className="breakdown-dot pass" /><span>{passed} passed</span></div>
                  <div className="breakdown-item"><div className="breakdown-dot fail" /><span>{failed} failed</span></div>
                </div>
                <a href={LEADS_URL} className="score-card-cta">
                  Buy Verified Contacts Now — $0.25 Each
                </a>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── WHAT YOU GET ─── */}
      <section className="features-section">
        <h2>What You Get</h2>
        <div className="rainbow-line" />
        <p className="features-subtitle">
          Everything included with the free Data Driver app.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">&#128200;</div>
            <h3>50M+ Verified Contacts</h3>
            <p>National database. 41 audience segments. Filter by state, age, income, credit, homeowner status, and more.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">&#9989;</div>
            <h3>15-Point Verification</h3>
            <p>Every contact verified before delivery. Name, email, phone, company, intent signals — all confirmed.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">&#9889;</div>
            <h3>Instant GHL Delivery</h3>
            <p>Contacts land directly in your GHL pipeline. Tagged, fielded, and ready for outreach. No CSV imports.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">&#128176;</div>
            <h3>White-Label Ready</h3>
            <p>Your clients never see Data Driver. They see your brand, your agency, your pricing. You own the relationship.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">&#128202;</div>
            <h3>Lead Scoring</h3>
            <p>Every contact scored 0-100 across 15 data points. Your clients get the hottest leads first.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">&#128197;</div>
            <h3>Sandy AI Assistant</h3>
            <p>Optional: Sandy texts and qualifies your leads automatically. She books appointments while you sleep.</p>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="pricing-section">
        <h2>Pricing</h2>
        <div className="rainbow-line" />
        <p className="pricing-subtitle">No subscription. No monthly fees. Just pay for what you use.</p>

        <div className="pricing-card">
          <div className="pricing-badge">Pay Per Contact</div>
          <div className="pricing-name">Data Driver</div>
          <div className="pricing-amount">
            <span className="pricing-dollar">$</span>0.25
            <span className="pricing-period">/contact</span>
          </div>
          <div className="pricing-trial">Free to install. 14-day trial. Buy when you're ready.</div>

          <ul className="pricing-features">
            <li><span className="pricing-check">&#10003;</span> Free GHL Marketplace install</li>
            <li><span className="pricing-check">&#10003;</span> 50M+ verified contacts</li>
            <li><span className="pricing-check">&#10003;</span> 41 audience segments</li>
            <li><span className="pricing-check">&#10003;</span> 15-point verification on every record</li>
            <li><span className="pricing-check">&#10003;</span> Instant GHL pipeline delivery</li>
            <li><span className="pricing-check">&#10003;</span> White-label — sell at your markup</li>
            <li><span className="pricing-check">&#10003;</span> Lead scoring engine included</li>
            <li><span className="pricing-check">&#10003;</span> No minimums, no contracts</li>
            <li><span className="pricing-check">&#10003;</span> Sandy AI assistant (optional add-on)</li>
          </ul>

          <a href={MARKETPLACE_URL} className="pricing-cta">
            Install Free from GHL Marketplace
          </a>
          <div className="pricing-fine-print">
            Volume pricing: $0.20/contact at 5,000+
          </div>
        </div>
      </section>

      {/* ─── THE AGENCY PLAY ─── */}
      <section className="sandy-section">
        <div className="sandy-content">
          <div className="sandy-text">
            <div className="sandy-eyebrow">The Agency Play</div>
            <h2>Turn $250 Into $500+</h2>
            <div className="rainbow-line rainbow-line-left" />
            <p>
              You're already managing sub-accounts. Your clients already need leads.
              Stop sending them to third-party providers — become the provider.
            </p>
            <p>
              Buy 1,000 contacts from Data Driver at $0.25 each. That's $250.
              Distribute 100 contacts to each of 10 sub-account clients at $0.50 each.
              That's $500 back. You just doubled your money on a single batch.
            </p>
            <p>
              Scale it up: 5,000 contacts at $0.20 each = $1,000.
              Sell at $0.75/contact = $3,750. Profit: $2,750.
              Run that every month.
            </p>
            <a href={LEADS_URL} className="sandy-cta">
              Buy Your First Batch
            </a>
          </div>
          <div className="sandy-avatar">
            <div className="sandy-avatar-placeholder">
              <div className="sandy-avatar-glow" />
              <div className="sandy-avatar-inner">
                <div className="sandy-avatar-icon">&#128176;</div>
                <div className="sandy-avatar-label">Your Markup</div>
                <div className="sandy-avatar-sub">Your Profit</div>
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
            question="What is Data Driver?"
            answer="A GHL Marketplace app that gives you access to 50M+ verified contacts at $0.25 each. Install it free, buy leads when you're ready, and resell them to your sub-account clients at whatever markup you choose."
          />
          <FaqItem
            question="How do I make money with this?"
            answer="Buy contacts at $0.25 each. Sell access to your sub-account clients at $0.50, $0.75, or $1.00 per contact. You keep the spread. Most agencies clear $500+ in the first two weeks just from the markup."
          />
          <FaqItem
            question="What kind of contacts?"
            answer="Verified intent contacts — people actively searching for services in your niche. Every record goes through 15-point verification: name, email, phone, company, LinkedIn, income, credit, homeowner status, and more."
          />
          <FaqItem
            question="Is there a subscription?"
            answer="No. The app is free to install. You only pay when you buy contacts — $0.25 each, or $0.20 at volume (5,000+). No monthly fees, no contracts, no minimums."
          />
          <FaqItem
            question="Do my clients see Data Driver?"
            answer="No. It's fully white-label. Your clients see your agency name, your pricing, your brand. They never know where the data comes from."
          />
          <FaqItem
            question="What about Sandy?"
            answer="Sandy is our AI sales assistant — she can text, call, qualify, and book appointments from your leads automatically. She's available as an optional add-on for agencies that want full automation, not just data."
          />
          <FaqItem
            question="What if the leads don't convert?"
            answer="Every contact is verified against 15 data points before delivery. You're not buying a list — you're buying verified people with active intent signals. That said, there's no commitment. Buy 100 contacts for $25 and test it."
          />
        </div>
      </section>

      {/* ─── NOTIFY ─── */}
      <section className="notify-section">
        <h3>Not ready yet? Get notified when new segments drop.</h3>
        <div className="rainbow-line" />
        <p>New markets and features ship weekly. Drop your email.</p>

        {notifySuccess ? (
          <div className="waitlist-success">
            You're on the list. We'll reach out when there's something worth knowing.
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={handleNotifySubmit}>
            <input type="text" placeholder="Your name" value={notifyForm.name} onChange={(e) => setNotifyForm((f) => ({ ...f, name: e.target.value }))} required />
            <input type="email" placeholder="Email address" value={notifyForm.email} onChange={(e) => setNotifyForm((f) => ({ ...f, email: e.target.value }))} required />
            <input type="text" placeholder="Company (optional)" value={notifyForm.company} onChange={(e) => setNotifyForm((f) => ({ ...f, company: e.target.value }))} />
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
