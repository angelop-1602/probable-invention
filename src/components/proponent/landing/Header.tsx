"use client";
import React from "react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const navigationItems = [
    { name: "Home", href: "#" },
    { name: "About Us", href: "#about" },
    { name: "Meet the Members", href: "#members" },
    { name: "FAQ", href: "#faqs" },
  ];

  return (
    <header className="bg-primary text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 ">
          <div className="flex items-center space-x-4">
            <a href="/">
              <img
                src="/SPUP-REC-logo.png"
                alt="SPUP REC Logo"
                className="h-10 w-auto"
              />
            </a>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  window.dispatchEvent(new Event("openCommitteeMembers"));
                }}
                className="hover:text-secondary transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>

          <div className="flex space-x-2">
            <Button
              type="button"
              className="animate-bounceOnce text-primary bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500
    hover:bg-gradient-to-br shadow-lg shadow-yellow-600/50 dark:shadow-lg dark:shadow-yellow-900/80
    font-medium rounded-lg text-[.9rem] px-5 py-2.5 text-center me-2
    transition-all duration-300 ease-in-out transform hover:scale-105 w-40 h-9 hover:font-bold"
            >
              Submit Now!
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
