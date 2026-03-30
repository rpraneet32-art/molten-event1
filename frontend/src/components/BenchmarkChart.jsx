import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { runBenchmark } from "../utils/api";

/**
 * BenchmarkChart
 * ---------------
 * Runs speed vs accuracy benchmarks and visualizes results.
 * Deliverable #3: "Benchmarks showing speed vs accuracy trade-offs"
 */

export default function BenchmarkChart() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runBenchmark({
        accuracy_levels: [0.80, 0.85, 0.90, 0.95, 0.99],
        query_types: ["count_distinct", "sum", "avg"],
        column: "amount",
        iterations: 3,
      });
      setData(result.benchmarks);
    } catch (err) {
      setError(err.message || "Benchmark failed");
    } finally {
      setLoading(false);
    }
  };

  // Transform data for time comparison chart
  const getTimeData = () => {
    if (!data) return [];
    const grouped = {};
    data.forEach((item) => {
      const key = `${Math.round(item.accuracy_target * 100)}%`;
      if (!grouped[key]) {
        grouped[key] = { accuracy: key };
      }
      grouped[key][`${item.query_type}_exact`] = item.avg_exact_time_ms;
      grouped[key][`${item.query_type}_approx`] = item.avg_approx_time_ms;
    });
    return Object.values(grouped);
  };

  // Transform for speedup chart
  const getSpeedupData = () => {
    if (!data) return [];
    return data.map((item) => ({
      name: `${item.query_type} @ ${Math.round(item.accuracy_target * 100)}%`,
      speedup: item.avg_speedup,
      error_pct: item.avg_error_pct,
      query_type: item.query_type,
      accuracy: item.accuracy_target,
    }));
  };

  // Error vs Speedup trade-off scatter data
  const getTradeoffData = () => {
    if (!data) return [];
    return data.map((item) => ({
      speedup: item.avg_speedup,
      error: item.avg_error_pct,
      label: `${item.query_type} @ ${Math.round(item.accuracy_target * 100)}%`,
    }));
  };

  const CHART_TOOLTIP = {
    contentStyle: {
      backgroundColor: "#0f172a",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "12px",
      fontSize: "12px",
    },
    labelStyle: { color: "#e2e8f0" },
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">📊 Benchmarks</h2>
          <p className="text-gray-400 mt-2 text-sm">
            Speed vs accuracy trade-off analysis across different accuracy targets.
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Running Benchmarks...
            </>
          ) : (
            <>🚀 Run Benchmarks</>
          )}
        </button>
      </div>

      {error && (
        <div className="glass-card p-4 border-red-500/30">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {!data && !loading && (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">📈</p>
          <p className="text-gray-400">Click "Run Benchmarks" to generate speed vs accuracy data.</p>
          <p className="text-gray-600 text-sm mt-2">
            Tests COUNT DISTINCT, SUM, AVG across 5 accuracy levels (80%-99%).
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary Table */}
          <div className="glass-card p-6 overflow-x-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">📋 Benchmark Results</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Query</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Accuracy Target</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Exact (ms)</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Approx (ms)</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Speedup</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Error %</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="py-2 px-3 font-mono text-gray-300">{row.query_type}</td>
                    <td className="py-2 px-3 text-gray-300">{Math.round(row.accuracy_target * 100)}%</td>
                    <td className="py-2 px-3 text-right text-gray-400">{row.avg_exact_time_ms}</td>
                    <td className="py-2 px-3 text-right text-primary-400 font-semibold">{row.avg_approx_time_ms}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={`font-bold ${row.avg_speedup >= 3 ? "text-emerald-400" : row.avg_speedup >= 2 ? "text-amber-400" : "text-gray-400"}`}>
                        {row.avg_speedup}×
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`${row.avg_error_pct < 2 ? "text-emerald-400" : row.avg_error_pct < 5 ? "text-amber-400" : "text-red-400"}`}>
                        {row.avg_error_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Speedup Bar Chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">🚀 Speedup Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSpeedupData()} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Speedup (×)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="speedup" fill="url(#speedupGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="speedupGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Error vs Speedup Scatter */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">⚖️ Speed vs Accuracy Trade-off</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="speedup" name="Speedup" unit="×" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis dataKey="error" name="Error" unit="%" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    {...CHART_TOOLTIP}
                    formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : value, name]}
                  />
                  <Scatter data={getTradeoffData()} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
