import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroLanding from "./components/HeroLanding";
import QueryBuilder from "./components/QueryBuilder";
import BenchmarkChart from "./components/BenchmarkChart";
import StreamingDashboard from "./components/StreamingDashboard";
import DocsPage from "./components/DocsPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface-900">
        {/* Background gradient effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/[0.07] rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/[0.05] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-pink-500/[0.04] rounded-full blur-[100px]" />
        </div>

        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HeroLanding />} />
            <Route path="/analysis" element={<QueryBuilder />} />
            <Route path="/benchmarks" element={<BenchmarkChart />} />
            <Route path="/streaming" element={<StreamingDashboard />} />
            <Route path="/docs" element={<DocsPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.04] mt-16 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              Dino Data — Built for Speed and Scale
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>FastAPI + DuckDB</span>
              <span>•</span>
              <span>React + Recharts</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
