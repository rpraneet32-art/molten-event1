import React, { useEffect, useState } from 'react';

export default function AlgorithmVisualizer({ technique }) {
  const [activeNodes, setActiveNodes] = useState([]);

  useEffect(() => {
    // Generate a random flashing effect to simulate algorithm computation
    const interval = setInterval(() => {
      if (technique.includes("HyperLogLog")) {
        // Light up random buckets
        setActiveNodes(Array.from({ length: 16 }).map(() => Math.random() > 0.7));
      } else if (technique.includes("Reservoir")) {
        // Swap random elements in the array
        setActiveNodes(Array.from({ length: 48 }).map(() => Math.random() > 0.9));
      } else if (technique.includes("CMS") || technique.includes("proportion")) {
        // Count min sketch hash matrix
        setActiveNodes(Array.from({ length: 24 }).map(() => Math.random() > 0.85));
      }
    }, 150);

    return () => clearInterval(interval);
  }, [technique]);

  const renderVisual = () => {
    if (technique.includes("HyperLogLog")) {
      return (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-primary-300 font-mono mb-1">h(x) = 010110...</div>
          <div className="flex flex-wrap gap-1">
            {activeNodes.map((isActive, i) => (
              <div 
                key={i} 
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all duration-150 ${isActive ? 'bg-primary-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.8)] scale-110' : 'bg-surface-700 text-gray-500'}`}
              >
                {isActive ? '0' : '1'}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-gray-400 mt-2">Computing Longest Leading Zeros</div>
        </div>
      );
    }

    if (technique.includes("Reservoir")) {
      return (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-blue-300 font-mono mb-1">P(replace) = k/i</div>
          <div className="grid grid-cols-12 gap-1">
            {activeNodes.map((isActive, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full transition-all duration-150 ${isActive ? 'bg-blue-400 scale-150 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-surface-600'}`}
              />
            ))}
          </div>
          <div className="text-[10px] text-gray-400 mt-2">Uniform Random Sub-population Maintained</div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs text-emerald-300 font-mono mb-1">min(h₁(x), h₂(x), h₃(x))</div>
        <div className="grid grid-rows-3 gap-1">
          {[0, 1, 2].map(row => (
            <div key={row} className="flex gap-1">
              {activeNodes.slice(row * 8, row * 8 + 8).map((isActive, i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-sm transition-all duration-150 ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-surface-700 border border-white/5'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-400 mt-2">Frequency Matrix Hash Collisions</div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-surface-800/50 rounded-xl border border-white/[0.05] mt-4 flex items-center justify-between">
      <div>
        <h4 className="text-sm font-semibold text-white mb-2 ml-1">Live Computation Matrix</h4>
        <div className="pl-1">
          {renderVisual()}
        </div>
      </div>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-900 border border-white/10 shadow-inner relative overflow-hidden">
        {/* Subtle scanning line effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/20 to-transparent h-[200%] animate-[scan_2s_linear_infinite]" />
        <span className="text-xl relative z-10">⚙️</span>
      </div>
    </div>
  );
}
