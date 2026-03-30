import React from "react";

/**
 * AccuracySlider
 * ---------------
 * A configurable accuracy/speed trade-off slider.
 * Maps a value from 80% to 99% accuracy.
 *
 * Brownie Point: "Configurable trade-off"
 */

export default function AccuracySlider({ value, onChange }) {
  const pct = Math.round(value * 100);

  // Color based on accuracy level
  const getColor = () => {
    if (pct >= 95) return { bar: "from-emerald-500 to-green-400", text: "text-emerald-400", label: "High Accuracy" };
    if (pct >= 90) return { bar: "from-blue-500 to-cyan-400", text: "text-blue-400", label: "Balanced" };
    if (pct >= 85) return { bar: "from-amber-500 to-yellow-400", text: "text-amber-400", label: "Fast" };
    return { bar: "from-red-500 to-orange-400", text: "text-red-400", label: "Ultra Fast" };
  };

  const color = getColor();

  // Estimated speed improvement
  const speedEstimate = ((0.99 - value) / 0.19 * 8 + 2).toFixed(1);

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">
          ⚙️ Accuracy Target
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          pct >= 95 ? "badge-green" : pct >= 90 ? "badge-blue" : pct >= 85 ? "badge-amber" : "badge-red"
        }`}>
          {color.label}
        </span>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min="80"
          max="99"
          value={pct}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
                     bg-surface-900 accent-primary-500
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-primary-400
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:shadow-primary-500/40
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-white/20"
        />
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>80% (Fastest)</span>
          <span>99% (Most Accurate)</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-900/60 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold gradient-text">{pct}%</p>
          <p className="text-[10px] text-gray-500 mt-1">Accuracy</p>
        </div>
        <div className="bg-surface-900/60 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">~{speedEstimate}×</p>
          <p className="text-[10px] text-gray-500 mt-1">Est. Speedup</p>
        </div>
      </div>
    </div>
  );
}
