"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: "Home", href: "#" },
    { name: "About Us", href: "#about" },
    { name: "Meet the Members", href: "#members" },
    { name: "FAQ", href: "#faqs" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (href: string) => {
    if (href === "#members") {
      window.dispatchEvent(new Event("openCommitteeMembers"));
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-primary text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img
                src="/SPUP-REC-logo.png"
                alt="SPUP REC Logo"
                className="h-8 sm:h-10 w-auto"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className="hover:text-secondary transition-colors duration-200 text-sm lg:text-base"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop Submit Button */}
          <div className="hidden md:flex">
            <Link href="/auth/sign-in">
              <Button
                type="button"
                className="text-primary bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500
                hover:bg-gradient-to-br shadow-lg shadow-yellow-600/50 dark:shadow-lg dark:shadow-yellow-900/80
                font-medium rounded-lg text-sm px-4 py-2 lg:px-5 lg:py-2.5
                transition-all duration-300 ease-in-out transform hover:scale-105 hover:font-bold"
              >
                Submit Now!
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-secondary transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-primary border-t border-secondary/20">
            <nav className="px-4 py-4 space-y-4">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="block text-white hover:text-secondary transition-colors duration-200 py-2 border-b border-secondary/10 last:border-b-0"
                >
                  {item.name}
                </a>
              ))}
              
              {/* Mobile Submit Button */}
              <div className="pt-4">
                <Link href="/auth/sign-in" className="block">
                  <Button
                    type="button"
                    className="w-full text-primary bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500
                    hover:bg-gradient-to-br shadow-lg shadow-yellow-600/50 dark:shadow-lg dark:shadow-yellow-900/80
                    font-medium rounded-lg text-base px-5 py-3
                    transition-all duration-300 ease-in-out transform hover:scale-105 hover:font-bold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Submit Now!
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
