import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import AlgorithmVisualizer from "./AlgorithmVisualizer";

/**
 * ResultsComparison
 * ------------------
 * Side-by-side comparison of exact vs approximate query results.
 *
 * Brownie Point: "Comparison UI where users can compare approximate vs exact results"
 */

export default function ResultsComparison({ data }) {
  if (!data) return null;

  const { exact, approximate, comparison } = data;

  const isGroupBy = typeof exact.result === "object" && exact.result !== null;

  // Prepare chart data for GROUP BY results
  const chartData = isGroupBy
    ? Object.keys(exact.result).map((key) => ({
        name: key.length > 12 ? key.substring(0, 12) + "…" : key,
        fullName: key,
        Exact: exact.result[key],
        Approximate: approximate.result[key] || 0,
      }))
    : null;

  // Accuracy color
  const getAccuracyColor = (pct) => {
    if (pct >= 98) return "text-emerald-400";
    if (pct >= 95) return "text-green-400";
    if (pct >= 90) return "text-blue-400";
    if (pct >= 85) return "text-amber-400";
    return "text-red-400";
  };

  // Speedup color
  const getSpeedupColor = (x) => {
    if (x >= 5) return "text-emerald-400";
    if (x >= 3) return "text-green-400";
    if (x >= 2) return "text-amber-400";
    return "text-gray-400";
  };

  const formatMemory = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
    return bytes + " B";
  };

  const exactMemStr = formatMemory(comparison.exact_memory_bytes);
  const approxMemStr = formatMemory(comparison.approx_memory_bytes);
  const memReduction = comparison.exact_memory_bytes 
    ? (((comparison.exact_memory_bytes - comparison.approx_memory_bytes) / comparison.exact_memory_bytes) * 100).toFixed(2)
    : 0;

  return (
    <div className="space-y-6 animate-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="glass-card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Accuracy</p>
          <p className={`text-3xl font-bold ${getAccuracyColor(comparison.accuracy_pct)}`}>
            {comparison.accuracy_pct}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Error: {comparison.error_pct}%
          </p>
        </div>

        {/* Speedup */}
        <div className="glass-card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Speedup</p>
          <p className={`text-3xl font-bold ${getSpeedupColor(comparison.speedup)}`}>
            {comparison.speedup}×
          </p>
          <p className="text-xs text-gray-500 mt-1">faster than exact</p>
        </div>

        {/* Time Comparison */}
        <div className="glass-card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Time</p>
          <div className="flex items-center justify-center gap-3">
            <div>
              <p className="text-lg font-bold text-gray-300">{comparison.exact_time_ms}ms</p>
              <p className="text-[10px] text-gray-500">Exact</p>
            </div>
            <span className="text-gray-600">→</span>
            <div>
              <p className="text-lg font-bold text-primary-400">{comparison.approx_time_ms}ms</p>
              <p className="text-[10px] text-gray-500">Approx</p>
            </div>
          </div>
        </div>

        {/* Memory Footprint */}
        <div className="glass-card p-5 text-center border-t-2 border-t-blue-500/50">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">RAM Footprint</p>
          <div className="flex items-center justify-center gap-3">
            <div className="line-through opacity-50">
              <p className="text-sm font-bold text-gray-300">{exactMemStr}</p>
            </div>
            <span className="text-gray-600">→</span>
            <div>
              <p className="text-lg font-bold text-blue-400">{approxMemStr}</p>
            </div>
          </div>
          <p className="text-[10px] text-emerald-400 mt-2">⭐ {memReduction}% Less Memory</p>
        </div>
      </div>

      {/* Side-by-Side Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exact Result */}
        <div className="glass-card p-5 border-l-4 border-l-blue-500/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">🎯 Exact Result</h3>
            <span className="badge-blue">DuckDB</span>
          </div>
          {isGroupBy ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(exact.result).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1.5 px-3 rounded-lg bg-surface-900/50 text-sm">
                  <span className="text-gray-400">{key}</span>
                  <span className="font-mono font-semibold text-gray-200">{val.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-100 font-mono">
              {typeof exact.result === "number" ? exact.result.toLocaleString() : exact.result}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-3">
            ⏱ {exact.time_ms}ms • {exact.sql && <span className="font-mono">{exact.query_type}</span>}
          </p>
        </div>

        {/* Approximate Result */}
        <div className="glass-card p-5 border-l-4 border-l-purple-500/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">≈ Approximate Result</h3>
            <span className="badge-green">{approximate.technique}</span>
          </div>
          {isGroupBy ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(approximate.result).map(([key, val]) => {
                const exactVal = exact.result[key] || 0;
                const err = exactVal ? Math.abs(val - exactVal) / exactVal * 100 : 0;
                return (
                  <div key={key} className="flex justify-between py-1.5 px-3 rounded-lg bg-surface-900/50 text-sm">
                    <span className="text-gray-400">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-200">{val.toLocaleString()}</span>
                      <span className={`text-[10px] ${err < 2 ? "text-emerald-400" : err < 5 ? "text-amber-400" : "text-red-400"}`}>
                        {err.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-3xl font-bold text-primary-300 font-mono">
              {typeof approximate.result === "number" ? approximate.result.toLocaleString() : approximate.result}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-3">
            ⏱ {approximate.time_ms}ms • Accuracy target: {approximate.accuracy_target * 100}%
          </p>

          <AlgorithmVisualizer technique={approximate.technique} />
        </div>
      </div>

      {/* GROUP BY Chart */}
      {isGroupBy && chartData && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">📊 Visual Comparison</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="Exact" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Approximate" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
