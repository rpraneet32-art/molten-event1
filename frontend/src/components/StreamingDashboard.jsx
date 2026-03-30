import React, { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { createStreamSocket } from "../utils/api";

/**
 * StreamingDashboard
 * -------------------
 * Real-time streaming analytics dashboard.
 *
 * Brownie Point: "Real-time analytics — streaming queries on live data"
 *
 * Connects to WebSocket endpoint and displays:
 * - Live transaction count
 * - Running average amount
 * - Unique users (HyperLogLog)
 * - Transactions per second
 * - Category distribution (Count-Min Sketch)
 * - Time-series charts
 */

export default function StreamingDashboard() {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const wsRef = useRef(null);

  const connect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = createStreamSocket(
      (data) => {
        setSnapshot(data);
        setConnected(true);
        setHistory((prev) => {
          const next = [...prev, {
            time: new Date().toLocaleTimeString(),
            transactions: data.total_transactions,
            unique_users: data.unique_users,
            avg_amount: data.running_avg_amount,
            tps: data.transactions_per_second,
          }];
          return next.slice(-30); // keep last 30 data points
        });
      },
      () => {
        setConnected(false);
      }
    );

    ws.onclose = () => setConnected(false);
    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const CHART_TOOLTIP = {
    contentStyle: {
      backgroundColor: "#0f172a",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "12px",
      fontSize: "12px",
    },
    labelStyle: { color: "#e2e8f0" },
  };

  // Category distribution data for bar chart
  const categoryData = snapshot?.category_distribution
    ? Object.entries(snapshot.category_distribution)
        .map(([name, count]) => ({
          name: name.length > 10 ? name.substring(0, 10) + "…" : name,
          count,
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">🔴 Live Streaming Analytics</h2>
          <p className="text-gray-400 mt-2 text-sm">
            Real-time approximate aggregates on streaming data using HLL & Count-Min Sketch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connected && (
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <span className="text-emerald-400 text-xs font-semibold">LIVE</span>
            </div>
          )}
          {!connected ? (
            <button onClick={connect} className="btn-primary flex items-center gap-2">
              ▶ Start Stream
            </button>
          ) : (
            <button onClick={disconnect} className="btn-secondary flex items-center gap-2 text-red-400 border-red-500/20 hover:bg-red-500/10">
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      {!connected && !snapshot && (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">📡</p>
          <p className="text-gray-400">Click "Start Stream" to begin receiving live data.</p>
          <p className="text-gray-600 text-sm mt-2">
            Simulates ~100 transactions/second with real-time approximate analytics.
          </p>
        </div>
      )}

      {snapshot && (
        <>
          {/* Live Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-100">
                {snapshot.total_transactions?.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-600 mt-1">Exact count</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Unique Users</p>
              <p className="text-2xl font-bold text-primary-400">
                {snapshot.unique_users?.toLocaleString()}
              </p>
              <p className="text-[10px] text-purple-500 mt-1">≈ HyperLogLog estimate</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Amount</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${snapshot.running_avg_amount}
              </p>
              <p className="text-[10px] text-gray-600 mt-1">Running mean</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Throughput</p>
              <p className="text-2xl font-bold text-amber-400">
                {snapshot.transactions_per_second}
              </p>
              <p className="text-[10px] text-gray-600 mt-1">txn/second</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Volume Line Chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">📈 Transaction Volume</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Unique Users Line Chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">👥 Unique Users (HLL)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Line
                    type="monotone"
                    dataKey="unique_users"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Running Average Line Chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">💰 Average Amount (Live)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={["auto", "auto"]} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Line
                    type="monotone"
                    dataKey="avg_amount"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution Bar Chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">🏷️ Category Distribution (CMS)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="count" fill="url(#catGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="catGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
