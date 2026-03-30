import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/analysis", label: "Query Engine", icon: "⚡" },
  { to: "/benchmarks", label: "Benchmarks", icon: "📊" },
  { to: "/streaming", label: "Live Stream", icon: "🔴" },
  { to: "/docs", label: "Docs", icon: "📖" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-white/[0.06] rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-xl shadow-lg shadow-yellow-500/30 hover:scale-105 transition-transform">
              🦖
            </NavLink>
            <div className="hidden sm:block">
              <NavLink to="/">
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Dino Data</h1>
                <p className="text-[10px] text-gray-400 -mt-1 uppercase tracking-wide">Approximate Query</p>
              </NavLink>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? "bg-primary-500/15 text-primary-400 border border-primary-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-fade-in">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary-500/15 text-primary-400"
                      : "text-gray-400 hover:bg-white/5"
                  }`
                }
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
