// components/custom/PricingPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Zap, Shield, Crown, Check, CreditCard, Loader2,
  Sparkles, ArrowRight, MessageCircle, Brain, BarChart3,
  FileText, Users, Star, ChevronDown, ChevronUp, Coins,
} from "lucide-react";
import Footer from "./Footer";

/* ── plan config ── */
const PLAN_META = {
  standard:     { icon: Zap,    color: "blue",   badge: null,        popular: false },
  intermediate: { icon: Shield, color: "violet", badge: "Popular",   popular: true  },
  advanced:     { icon: Crown,  color: "amber",  badge: "Best Value", popular: false },
};

const COLOR = {
  blue:   { ring: "ring-blue-200",   bg: "bg-blue-50",   text: "text-blue-700",   btn: "bg-blue-700 hover:bg-blue-800",   badge: "bg-blue-100 text-blue-700"   },
  violet: { ring: "ring-violet-300", bg: "bg-violet-50", text: "text-violet-700", btn: "bg-violet-700 hover:bg-violet-800", badge: "bg-violet-100 text-violet-700" },
  amber:  { ring: "ring-amber-200",  bg: "bg-amber-50",  text: "text-amber-700",  btn: "bg-amber-600 hover:bg-amber-700",  badge: "bg-amber-100 text-amber-700"  },
};

/* per-plan feature lists */
const FEATURES = {
  standard: [
    "200 AI interview credits",
    "Basic AI mock interviews",
    "AI feedback on answers",
    "Resume auto-fill (AI parsed)",
    "Access to interview question bank",
    "Email support",
  ],
  intermediate: [
    "1,000 AI interview credits",
    "Advanced AI mock interviews",
    "Detailed AI feedback & scoring",
    "Resume auto-fill (AI parsed)",
    "Organization team access",
    "AI candidate filtering",
    "Performance analytics",
    "Priority email support",
  ],
  advanced: [
    "5,000 AI interview credits",
    "Unlimited AI mock interviews",
    "In-depth scoring & benchmarks",
    "Resume auto-fill (AI parsed)",
    "Full organization dashboard",
    "AI candidate filtering (unlimited)",
    "Advanced analytics & reports",
    "Schedule management tools",
    "Member score tracking",
    "Dedicated support",
  ],
};

const WHAT_YOU_CAN_DO = [
  { icon: Brain,       label: "AI Mock Interviews",        desc: "Practice with AI-powered questions tailored to your role and skill level." },
  { icon: FileText,    label: "Resume AI Parsing",         desc: "Upload your resume and AI extracts all details including academic marks." },
  { icon: BarChart3,   label: "Performance Analytics",     desc: "Track scores across sessions and identify improvement areas." },
  { icon: Users,       label: "Team Management",           desc: "Invite team members and monitor their interview performance." },
  { icon: MessageCircle, label: "AI Feedback",             desc: "Get instant AI-generated feedback on every answer you give." },
  { icon: Sparkles,    label: "AI Candidate Filtering",    desc: "Filter candidates using natural language — AI converts it to DB queries." },
];

const FAQS = [
  { q: "How do credits work?", a: "Each AI operation costs credits. An AI mock interview costs 4 credits per question. Resume parsing costs 4 credits. Credits never expire." },
  { q: "Can I use credits for multiple features?", a: "Yes — credits are shared across all features. AI mock interviews, resume parsing, candidate filtering, and all other AI features draw from the same credit pool." },
  { q: "Do unused credits expire?", a: "No. Credits you purchase never expire. Use them at your own pace." },
  { q: "How does payment work?", a: "During development, payments are handled by a development simulator. No real money is charged."},
  { q: "Can organizations share credits?", a: "Credits are tied to individual accounts. Organization members each need their own credit balance for AI features." },
  { q: "Is there a free tier?", a: "Yes! New accounts start with 20 free credits to try the platform before purchasing." },
];

/* ──────────────────────────────────────────────────────── */

const PricingPage = () => {
  const navigate   = useNavigate();
  const [plans, setPlans]         = useState([]);
  const [paying, setPaying]       = useState("");
  const [openFaq, setOpenFaq]     = useState(null);
  const [credits, setCredits]     = useState(null);

  const token    = localStorage.getItem("token");
  const isLoggedIn = !!token;

  useEffect(() => {
    axios.get("http://localhost:8000/api/payments/plans")
      .then((res) => setPlans(res.data.plans || []))
      .catch(() => setPlans([
        { id: "standard",     name: "Standard",     credits: 200,  amount: 299  },
        { id: "intermediate", name: "Intermediate", credits: 1000, amount: 899  },
        { id: "advanced",     name: "Advanced",     credits: 5000, amount: 3999 },
      ]));

    if (isLoggedIn) {
      axios.get("http://localhost:8000/api/payments/credits", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setCredits(res.data.credits ?? 0)).catch(() => {});
    }
  }, []);

const buyPlan = async (planId) => {
  if (!isLoggedIn) {
    navigate("/home/login");
    return;
  }

  setPaying(planId);

  try {
    const orderRes = await axios.post(
      "http://localhost:8000/api/payments/create-order",
      { planId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { provider, order, plan } = orderRes.data;

    /*
     * DEVELOPMENT PAYMENT SIMULATOR
     */
    if (provider === "simulator") {
      const simulatedPaymentId =
        `sim_payment_${crypto.randomUUID()}`;

      const verifyRes = await axios.post(
        "http://localhost:8000/api/payments/verify",
        {
          providerOrderId: order.id,
          providerPaymentId: simulatedPaymentId,
          providerSignature: "simulator_signature",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const newCredits = verifyRes.data.credits ?? 0;

      setCredits(newCredits);

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          credits: newCredits,
        })
      );

      alert(
        `Development payment successful!\n\n${plan.name}\n+${plan.credits} credits\n\nYou now have ${newCredits} credits.`
      );

      return;
    }
    throw new Error(
      `Unsupported payment provider: ${provider}`
    );
  } catch (err) {
    console.error("Payment error:", err);

    alert(
      err.response?.data?.msg ||
      err.message ||
      "Payment failed. Please try again."
    );
  } finally {
    setPaying("");
  }
};

  return (
    <div className="bg-white min-h-screen">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 px-4 py-1.5 rounded-full mb-5">
            <Sparkles size={13} className="text-blue-700" />
            <span className="text-xs font-semibold text-blue-700">Simple, transparent pricing</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Invest in your <span className="text-blue-700">interview success</span>
          </h1>
          <p className="text-base text-gray-500 max-w-xl mx-auto mb-6 leading-relaxed">
            Pay once, use forever. Buy credits and access every AI-powered feature — mock interviews, resume parsing, candidate filtering, and more.
          </p>
          {isLoggedIn && credits !== null && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-full text-sm font-semibold text-blue-700 shadow-sm">
              <Coins size={15} />
              You currently have <strong>{credits}</strong> credits
            </div>
          )}
          {!isLoggedIn && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Star size={14} className="text-amber-500" />
              New accounts start with <strong className="text-gray-700">20 free credits</strong>
            </div>
          )}
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const meta  = PLAN_META[plan.id] || PLAN_META.standard;
            const col   = COLOR[meta.color];
            const feats = FEATURES[plan.id] || [];
            const Icon  = meta.icon;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  meta.popular ? `${col.ring} ring-2 scale-[1.02]` : "border-gray-200"
                }`}
              >
                {/* Popular badge */}
                {meta.badge && (
                  <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[11px] font-bold ${col.badge}`}>
                    {meta.badge}
                  </div>
                )}

                <div className="p-6 pb-4">
                  <div className={`w-10 h-10 ${col.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={20} className={col.text} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>

                  <div className="mt-3 mb-1">
                    <span className="text-3xl font-extrabold text-gray-900">₹{plan.amount}</span>
                    <span className="text-sm text-gray-400 ml-1">one-time</span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${col.bg} ${col.text} rounded-full text-sm font-semibold mt-1`}>
                    <Coins size={13} />
                    {plan.credits.toLocaleString()} credits
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    ≈ {Math.floor(plan.credits / 4)} AI interview questions
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 py-4 flex-1">
                  <ul className="space-y-2.5">
                    {feats.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-4">
                  <button
                    onClick={() => buyPlan(plan.id)}
                    disabled={paying === plan.id}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition disabled:opacity-60 ${col.btn}`}
                  >
                    {paying === plan.id
                      ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
                      : <><CreditCard size={14} /> {isLoggedIn ? "Buy Now" : "Sign up & Buy"}</>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Credit cost reference ── */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">What can I do with credits?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { action: "AI Mock Interview (per question)", cost: 4, color: "blue" },
              { action: "Resume AI Parsing",                cost: 4, color: "violet" },
              { action: "AI Candidate Filter Search",       cost: 4, color: "indigo" },
              { action: "Interview Question Generation",    cost: 4, color: "emerald" },
              { action: "Scorecard Generation",             cost: 4, color: "amber" },
              { action: "AI Answer Feedback",               cost: 4, color: "rose" },
            ].map(({ action, cost, color }) => (
              <div key={action} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-sm text-gray-700">{action}</span>
                <span className={`px-2.5 py-1 bg-${color}-50 text-${color}-700 text-xs font-bold rounded-full border border-${color}-200`}>
                  {cost} credits
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature highlights ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Everything you get with credits</h2>
          <p className="text-sm text-gray-500 text-center mb-8">All features unlocked with any credit purchase.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHAT_YOU_CAN_DO.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-4 bg-white border border-gray-200 rounded-2xl hover:shadow-sm transition">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={18} className="text-blue-700" />
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Plan comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-2/5">Feature</th>
                  <th className="text-center px-4 py-3 font-semibold text-blue-700">Standard</th>
                  <th className="text-center px-4 py-3 font-semibold text-violet-700">Intermediate</th>
                  <th className="text-center px-4 py-3 font-semibold text-amber-700">Advanced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Credits",                    "200",   "1,000",  "5,000"],
                  ["AI Mock Interviews",          "✓",     "✓",      "✓"],
                  ["Resume AI Parsing",           "✓",     "✓",      "✓"],
                  ["AI Answer Feedback",          "✓",     "✓",      "✓"],
                  ["Organization Dashboard",      "—",     "✓",      "✓"],
                  ["AI Candidate Filtering",      "—",     "✓",      "✓"],
                  ["Performance Analytics",       "—",     "✓",      "✓"],
                  ["Member Score Tracking",       "—",     "✓",      "✓"],
                  ["Schedule Management",         "—",     "—",      "✓"],
                  ["Advanced Reports",            "—",     "—",      "✓"],
                  ["Support",                     "Email", "Priority","Dedicated"],
                ].map(([feat, s, i, a]) => (
                  <tr key={feat} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{feat}</td>
                    <td className="px-4 py-3 text-center text-blue-600 font-medium">{s}</td>
                    <td className="px-4 py-3 text-center text-violet-600 font-medium">{i}</td>
                    <td className="px-4 py-3 text-center text-amber-600 font-medium">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 text-left"
                >
                  {q}
                  {openFaq === i ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-12 px-4 bg-gradient-to-br from-blue-700 to-indigo-800">
        <div className="max-w-2xl mx-auto text-center">
          <Sparkles size={28} className="text-blue-300 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-2">Start practising today</h2>
          <p className="text-blue-100 text-sm mb-6">Join thousands of candidates who use AI to ace their interviews.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <button
                onClick={() => navigate("/profile")}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-700 font-bold rounded-full hover:bg-blue-50 transition text-sm"
              >
                Go to Dashboard <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/home/signup")}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-700 font-bold rounded-full hover:bg-blue-50 transition text-sm"
                >
                  Get Started Free <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => navigate("/home/login")}
                  className="inline-flex items-center gap-2 px-8 py-3 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition text-sm"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
