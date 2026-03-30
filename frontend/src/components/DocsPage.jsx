import React from "react";

/**
 * DocsPage
 * ---------
 * Documentation page explaining all the techniques used.
 * Deliverable #4: "Documentation explaining the chosen techniques"
 */

const TECHNIQUES = [
  {
    name: "HyperLogLog (HLL)",
    icon: "🔢",
    usedFor: "COUNT DISTINCT",
    color: "from-primary-500/20 to-purple-500/20",
    borderColor: "border-primary-500/30",
    description:
      "HyperLogLog is a probabilistic algorithm for estimating the number of distinct elements (cardinality) in a dataset using very little memory.",
    howItWorks: [
      "Hash each element to a binary string.",
      "Split hashes into buckets using the first few bits.",
      "Track the longest run of leading zeros per bucket.",
      "Use harmonic mean across buckets to estimate cardinality.",
    ],
    complexity: "O(1) per insert, O(m) space where m = 2^precision",
    errorRate: "~1.04 / √(2^p) — with p=14, error ≈ 0.8%",
    library: "datasketch (Python)",
    tradeoff:
      "Higher precision bits → more memory → lower error. We map the accuracy slider (80%–99%) to precision bits (6–16).",
  },
  {
    name: "Count-Min Sketch (CMS)",
    icon: "📊",
    usedFor: "COUNT / Frequency Estimation",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    description:
      "Count-Min Sketch is a space-efficient probabilistic data structure for tracking frequency counts of items in a stream. It never underestimates.",
    howItWorks: [
      "Maintain a 2D array with `depth` rows × `width` columns.",
      "Each row uses a different hash function.",
      "To ADD: hash the item with each function, increment those cells.",
      "To QUERY: take the MINIMUM across all rows for that item.",
    ],
    complexity: "O(d) per operation, O(w×d) space",
    errorRate: "Overestimates by at most εN with probability 1−δ",
    library: "Custom implementation (Python)",
    tradeoff:
      "Wider sketch (more columns) → fewer hash collisions → more accurate. We derive width from the accuracy slider.",
  },
  {
    name: "Reservoir Sampling",
    icon: "🎲",
    usedFor: "AVG, SUM, GROUP BY",
    color: "from-emerald-500/20 to-green-500/20",
    borderColor: "border-emerald-500/30",
    description:
      "Reservoir Sampling (Algorithm R) maintains a fixed-size uniform random sample from a stream or large dataset in a single pass.",
    howItWorks: [
      "Fill the reservoir with the first k items.",
      "For item i (where i > k): generate random j in [0, i).",
      "If j < k, replace reservoir[j] with the new item.",
      "After processing: reservoir contains a uniform random sample.",
    ],
    complexity: "O(1) per item, O(k) space",
    errorRate: "AVG estimate is unbiased; variance ~ σ²/k",
    library: "Custom implementation (Python)",
    tradeoff:
      "Larger sample size k → better estimates but slower. We map accuracy 80%→2% sample, 99%→30% sample.",
  },
];

const PIPELINE = [
  { step: 1, title: "Data Ingestion", desc: "1.2M e-commerce transactions loaded from Parquet into DuckDB.", icon: "📥" },
  { step: 2, title: "Exact Engine", desc: "DuckDB runs full SQL for ground truth (COUNT, SUM, AVG, GROUP BY).", icon: "🎯" },
  { step: 3, title: "Approximate Engine", desc: "Routes queries to HLL, CMS, or Reservoir Sampling based on type.", icon: "≈" },
  { step: 4, title: "Comparison", desc: "Both results returned with error %, speedup multiplier.", icon: "⚖️" },
  { step: 5, title: "Visualization", desc: "React + Recharts renders side-by-side comparison and benchmark charts.", icon: "📊" },
];

export default function DocsPage() {
  return (
    <div className="space-y-8 animate-in max-w-4xl mx-auto">
      <div>
        <h2 className="section-title">📖 Documentation</h2>
        <p className="text-gray-400 mt-2 text-sm">
          How the Approximate Query Engine works — techniques, trade-offs, and architecture.
        </p>
      </div>

      {/* Architecture Pipeline */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-5">🏗️ System Pipeline</h3>
        <div className="space-y-3">
          {PIPELINE.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-900 flex items-center justify-center text-lg border border-white/5">
                {item.icon}
              </div>
              <div className="flex-1 pb-3 border-b border-white/[0.04]">
                <p className="text-sm font-semibold text-gray-200">
                  Step {item.step}: {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technique Cards */}
      {TECHNIQUES.map((tech, i) => (
        <div key={i} className={`glass-card p-6 border-l-4 ${tech.borderColor}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{tech.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-200">{tech.name}</h3>
              <span className="badge-blue text-[10px]">Used for: {tech.usedFor}</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-4">{tech.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* How it works */}
            <div className="bg-surface-900/60 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                How It Works
              </p>
              <ol className="space-y-1.5">
                {tech.howItWorks.map((step, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {j + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Stats */}
            <div className="bg-surface-900/60 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Complexity</p>
                <p className="text-xs text-gray-300 font-mono">{tech.complexity}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Error Rate</p>
                <p className="text-xs text-gray-300 font-mono">{tech.errorRate}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Implementation</p>
                <p className="text-xs text-gray-300">{tech.library}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Trade-off Mapping</p>
                <p className="text-xs text-gray-400">{tech.tradeoff}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Query Type Mapping Table */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">🗺️ Query → Technique Mapping</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-2 px-3 text-gray-500">Query Type</th>
                <th className="text-left py-2 px-3 text-gray-500">Exact (DuckDB SQL)</th>
                <th className="text-left py-2 px-3 text-gray-500">Approximate Technique</th>
                <th className="text-left py-2 px-3 text-gray-500">Accuracy Control</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                ["COUNT", "SELECT COUNT(*)", "Count-Min Sketch", "Width/depth"],
                ["COUNT DISTINCT", "SELECT COUNT(DISTINCT col)", "HyperLogLog", "Precision bits (4–16)"],
                ["SUM", "SELECT SUM(col)", "Reservoir Sampling × scale", "Sample size"],
                ["AVG", "SELECT AVG(col)", "Reservoir Sampling mean", "Sample size"],
                ["GROUP BY", "SELECT col, AGG() GROUP BY", "Per-group Reservoir", "Sample size / group"],
              ].map(([qt, sql, tech, ctrl], i) => (
                <tr key={i} className="border-b border-white/[0.03]">
                  <td className="py-2 px-3 font-semibold text-gray-300">{qt}</td>
                  <td className="py-2 px-3 font-mono text-gray-400">{sql}</td>
                  <td className="py-2 px-3 text-primary-400">{tech}</td>
                  <td className="py-2 px-3 text-gray-500">{ctrl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">🛠️ Tech Stack</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: "FastAPI", role: "Backend API", color: "text-emerald-400" },
            { name: "DuckDB", role: "Exact SQL Engine", color: "text-amber-400" },
            { name: "Pandas + NumPy", role: "Data Processing", color: "text-blue-400" },
            { name: "datasketch", role: "HyperLogLog", color: "text-purple-400" },
            { name: "React.js", role: "Frontend UI", color: "text-cyan-400" },
            { name: "Recharts", role: "Data Visualization", color: "text-pink-400" },
          ].map((tech, i) => (
            <div key={i} className="bg-surface-900/60 rounded-xl p-3 border border-white/5">
              <p className={`text-sm font-semibold ${tech.color}`}>{tech.name}</p>
              <p className="text-[10px] text-gray-500">{tech.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
