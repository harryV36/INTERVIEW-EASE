import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users, Briefcase, UserCheck } from 'lucide-react';

export default function FreeTrialDropdown({ style }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const containerRef = useRef(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearTimers = () => {
    clearTimeout(openTimerRef.current);
    clearTimeout(closeTimerRef.current);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setIsSubmenuOpen(false);
    clearTimers();
  };

  const handleIndividualsEnter = () => {
    clearTimers();
    openTimerRef.current = setTimeout(() => setIsSubmenuOpen(true), 100);
  };

  const handleIndividualsLeave = () => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => setIsSubmenuOpen(false), 200);
  };

  const handleFeatureNavigate = (feature) => {
    navigate(`/feature-${feature}`);
    closeDropdown();
  };

  const menuOptions = [
    {
      name: 'For Individuals',
      description: 'Access all features for a single user',
      icon: <UserCheck size={16} className="text-blue-700" />,
      href: 'individual',
      hasSubmenu: true,
    },
    // {
    //   name: 'For Teams (5+ users)',
    //   description: 'Collaborative features and shared insights',
    //   icon: <Users size={16} className="text-indigo-600" />,
    //   href: 'teams',
    //   hasSubmenu: false,
    // },
    // {
    //   name: 'Enterprise',
    //   description: 'Custom plans and dedicated support',
    //   icon: <Briefcase size={16} className="text-gray-500" />,
    //   href: 'enterprise',
    //   hasSubmenu: false,
    // },
  ];

  const individualSubOptions = [
    { name: 'Student', description: 'Practice interviews for college & freshers', href: 'individual-student' },
    { name: 'Job Test', description: 'Boost your chances with targeted practice', href: 'individual-jobseeker' },
    // { name: 'Working Professional', description: 'Upskill and prepare for role changes', href: 'individual-professional' },
  ];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger — opens on click or hover */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        onMouseEnter={() => setIsOpen(true)}
        className={style}
      >
        Start Free Trial
      </button>

      {/* Main dropdown — opens UPWARD (bottom-full) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 bottom-full mb-2 z-50 w-72 rounded-2xl bg-white shadow-2xl border border-gray-100"
          >
            <div className="p-1.5">
              {menuOptions.map((item) => {
                if (!item.hasSubmenu) {
                  return (
                    <a
                      key={item.name}
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition">
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 block">{item.name}</span>
                        <span className="text-xs text-gray-500 mt-0.5 block">{item.description}</span>
                      </div>
                    </a>
                  );
                }

                return (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={handleIndividualsEnter}
                    onMouseLeave={handleIndividualsLeave}
                  >
                    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition cursor-pointer group">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 block group-hover:text-blue-700">{item.name}</span>
                        <span className="text-xs text-gray-500 mt-0.5 block">{item.description}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                    </div>

                    {/* Submenu — opens to the right */}
                    <AnimatePresence>
                      {isSubmenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-0 left-full ml-2 w-72 rounded-2xl bg-white shadow-2xl border border-gray-100 z-50"
                          onMouseEnter={handleIndividualsEnter}
                          onMouseLeave={handleIndividualsLeave}
                        >
                          <div className="p-1.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">Select your category</p>
                            {individualSubOptions.map((sub) => (
                              <button
                                key={sub.name}
                                onClick={() => handleFeatureNavigate(sub.href)}
                                className="w-full text-left flex flex-col p-3 rounded-xl hover:bg-blue-50 transition group"
                              >
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">{sub.name}</span>
                                <span className="text-xs text-gray-500 mt-0.5">{sub.description}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
