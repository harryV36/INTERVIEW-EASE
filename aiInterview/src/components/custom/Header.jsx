import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import axios from "axios";
import { Coins, CreditCard, Loader2, X } from "lucide-react";
import Profile from '../custom/profile';
import logo from '../../assets/logo.png';
import Dropdown from '../Utils/Dropdown';
import TextLogo from '../Logo/TextLogo';

// Smooth fade-in animation
const navItemVariant = {
  hidden: { opacity: 0, y: -8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" }
  })
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [plans, setPlans] = useState([]);
  const [credits, setCredits] = useState(null);
  const [payingPlan, setPayingPlan] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";

  // CHECK LOGIN STATE USING TOKEN IN LOCALSTORAGE
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  useEffect(() => {
    axios.get("http://localhost:8000/api/payments/plans")
      .then((res) => setPlans(res.data.plans || []))
      .catch(() => {
        setPlans([
          { id: "standard", name: "Standard", credits: 200, amount: 299 },
          { id: "intermediate", name: "Intermediate", credits: 1000, amount: 899 },
          { id: "advanced", name: "Advanced", credits: 5000, amount: 3999 },
        ]);
      });
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setCredits(null);
      return;
    }
    axios.get("http://localhost:8000/api/payments/credits", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setCredits(res.data.credits ?? 0);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...user, credits: res.data.credits ?? 0 }));
    }).catch(() => setCredits(null));
  }, [isLoggedIn, token]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About Us', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const menuItems = [
    { name: 'About Us', href: '/about' },
    { name: 'Newsroom', href: '/newsroom' },
    { name: 'Team', href: '/team' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Schedule a Demo', href: '/demo' },
  ];

  const handleLoginSignupNavigate = (name) => {
    navigate(`/home/${name}`);
  };

  const handleScroll = (e, href) => {
    e.preventDefault();

    // Full-page route navigation
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }

    // Show pricing dropdown (legacy — now only used by credits button)
    if (href === "#pricing") {
      setShowPricing((prev) => !prev);
      return;
    }

    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (!element) return;

    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };
  const buyPlan = async (planId) => {
  if (!isLoggedIn) {
    navigate("/home/login");
    return;
  }

  setPayingPlan(planId);

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

    if (provider !== "simulator") {
      throw new Error(
        `Payment provider "${provider}" is not supported by this development checkout yet.`
      );
    }

    /*
     * DEVELOPMENT PAYMENT SIMULATOR
     *
     * In simulator mode we pretend that the user
     * completed a successful payment.
     */
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

    setShowPricing(false);

    alert(
      `Development payment successful!\n\n${plan.name}\n+${plan.credits} credits\n\nYou now have ${newCredits} credits.`
    );
  } catch (err) {
    console.error("Payment error:", err);

    alert(
      err.response?.data?.msg ||
      err.message ||
      "Payment failed. Please try again."
    );
  } finally {
    setPayingPlan("");
  }
};

  const PricingPanel = () => (
    <div className="absolute right-6 top-[72px] z-[60] w-[min(680px,calc(100vw-32px))] bg-white border border-gray-200 shadow-2xl rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Buy interview credits</p>
          <p className="text-xs text-gray-500">New accounts start with 20 free credits.</p>
        </div>
        <button onClick={() => setShowPricing(false)} className="p-1.5 text-gray-400 hover:text-gray-700">
          <X size={16} />
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {plans.map((plan) => (
          <div key={plan.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{plan.name}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs {plan.amount}</p>
            <p className="text-sm text-gray-600 mt-1">{plan.credits.toLocaleString()} credits</p>
            <button
              onClick={() => buyPlan(plan.id)}
              disabled={payingPlan === plan.id}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2"
            >
              {payingPlan === plan.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="px-6 sm:px-10 lg:px-14 flex items-center justify-between py-4">

        {/* LEFT — LOGO */}
        <a href="/" className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-7 w-7 rounded-full" />
          <TextLogo />
        </a>

        {/* DESKTOP NAVIGATION */}
        {isHome && (
          <nav className="hidden md:flex justify-center items-center flex-1 space-x-6 mx-6">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.href}
                className="relative text-gray-600 font-medium text-sm"
                variants={navItemVariant}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={{ scale: 1.07, color: "#1e3a8a" }}
                onClick={(e) => handleScroll(e, link.href)}
              >
                {link.name}

                <motion.span
                  className="absolute left-0 -bottom-1 h-[2px] bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.25 }}
                />
              </motion.a>
            ))}

            {/* Company Dropdown */}
            <Dropdown
              menuItems={menuItems}
              style="text-gray-600 hover:text-gray-900 font-medium text-sm"
              name="Company"
            />
          </nav>
        )}

        {showPricing && <PricingPanel />}

        {/* DESKTOP ACTION BUTTONS - ONLY WHEN LOGGED OUT */}
        {isHome && !isLoggedIn && (
          <div className="hidden md:flex items-center space-x-3">
            <motion.button
              variants={navItemVariant}
              initial="hidden"
              animate="visible"
              custom={navLinks.length}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              whileHover={{ scale: 1.07 }}
              onClick={() => handleLoginSignupNavigate('login')}
            >
              Login
            </motion.button>

            <motion.button
              variants={navItemVariant}
              initial="hidden"
              animate="visible"
              custom={navLinks.length + 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              whileHover={{ scale: 1.07 }}
              onClick={() => handleLoginSignupNavigate('signup')}
            >
              Sign Up
            </motion.button>
          </div>
        )}

        {/* PROFILE ICON — ONLY WHEN LOGGED IN */}
        {isLoggedIn && (
          <div className="ml-3 flex items-center gap-3">
            <button
              onClick={() => setShowPricing((prev) => !prev)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-semibold hover:bg-blue-100"
            >
              <Coins size={16} />
              {credits ?? "—"} credits
            </button>
            <Profile />
          </div>
        )}

        {/* MOBILE MENU BUTTON */}
        {isHome && (
          <button
            onClick={toggleMenu}
            className="md:hidden ml-2 p-2 text-gray-600 hover:text-gray-800"
          >
            {isMenuOpen ? (
              <svg className="h-7 w-7" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {isHome && (
        <div
          className={`md:hidden bg-white shadow-lg overflow-hidden transition-all duration-300 ${
            isMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 border-t border-gray-100">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-5 py-3 text-gray-700 hover:bg-gray-100 text-lg"
                onClick={(e) => {
                  handleScroll(e, link.href);
                  setIsMenuOpen(false);
                }}
              >
                {link.name}
              </a>
            ))}

            {isLoggedIn && (
              <button
                onClick={() => setShowPricing((prev) => !prev)}
                className="mx-5 my-3 w-[calc(100%-40px)] flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-semibold"
              >
                <Coins size={16} /> {credits ?? "—"} credits
              </button>
            )}

            {/* MOBILE LOGIN/SIGNUP — ONLY WHEN LOGGED OUT */}
            {!isLoggedIn && (
              <div className="flex flex-col space-y-3 px-5 pt-4 border-t mt-4 pb-5">
                <button
                  className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg"
                  onClick={() => handleLoginSignupNavigate('login')}
                >
                  Login
                </button>

                <button
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => handleLoginSignupNavigate('signup')}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* MOBILE PROFILE — ONLY WHEN LOGGED IN */}
            {isLoggedIn && (
              <div className="px-5 py-3 border-t">
                <Profile />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
