import React from "react";
import { useNavigate } from "react-router-dom";

export default function HeroLanding() {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 text-center animate-fade-in overflow-hidden">
      
      {/* Jolly Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-yellow-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 flex flex-col items-center">
        
        {/* Playful Dino Icon */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-yellow-300 to-orange-500 flex items-center justify-center text-5xl sm:text-7xl shadow-[0_0_50px_rgba(251,191,36,0.3)] animate-pulse-slow">
          🦖
        </div>

        {/* Main Title */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500">
              Dino Data
            </span>
          </h1>
          <p className="text-xl sm:text-3xl font-medium text-white/90 font-inter">
            Save your time use dino data.
          </p>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-gray-400 mt-4 leading-relaxed">
            Unleash the power of probabilistic structures. Get answers highly accurate analytical answers 10x faster than traditional Data Lakes.
          </p>
        </div>

        {/* Interactive Speedup Button */}
        <div className="pt-8">
          <button
            onClick={() => navigate("/analysis")}
            className="group relative inline-flex items-center justify-center px-10 py-5 text-xl sm:text-2xl font-bold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full hover:scale-110 hover:shadow-[0_0_60px_rgba(251,191,36,0.8)] focus:outline-none focus:ring-4 focus:ring-yellow-500/50"
          >
            <span className="mr-3 text-2xl group-hover:animate-bounce">⚡</span>
            Speedup
            {/* Inner glow effect */}
            <div className="absolute inset-0 w-full h-full rounded-full ring-2 ring-white/20 group-hover:ring-white/50 transition-all opacity-0 group-hover:opacity-100" />
          </button>
        </div>

      </div>
    </div>
  );
}
