import React from 'react';
import { Mail, Twitter, Linkedin, Github, Instagram } from 'lucide-react';
import TextLogo from '../Logo/TextLogo';
import logo from '../../assets/logo.png';

const Footer = () => {
  const quickLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#' },
    { label: 'About Us', href: '#about' },
    { label: 'Contact', href: '#contact' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Instagram, href: '#', label: 'Instagram' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          {/* Left — Logo + tagline */}
          <div className="flex flex-col gap-2">
            <a href="/" className="flex items-center gap-2 w-fit">
              <img src={logo} alt="InterviewEase" className="h-6 w-6 rounded-full" />
              <TextLogo />
            </a>
            <p className="text-xs text-gray-400 max-w-[220px] leading-relaxed">
              AI-powered interview prep to help you land your dream job.
            </p>
          </div>

          {/* Center — Quick links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs text-gray-500 hover:text-blue-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right — Social + email */}
          <div className="flex flex-col gap-3 items-start md:items-end">
            <div className="flex items-center gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-8 w-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-700 hover:border-blue-200 transition-all duration-200"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
            <a
              href="mailto:support@interviewease.ai"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-700 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              support@interviewease.ai
            </a>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300">
            &copy; {new Date().getFullYear()} InterviewEase. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

