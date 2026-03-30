/**
 * api.js
 * ------
 * API utility functions to communicate with the FastAPI backend.
 * All requests go to http://localhost:8000
 */

import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/**
 * Get dataset info (total rows, columns, sample rows).
 */
export async function getDataInfo() {
  const res = await api.get("/api/data/info");
  return res.data;
}

/**
 * Run an exact query.
 */
export async function runExactQuery(params) {
  const res = await api.post("/api/query/exact", params);
  return res.data;
}

/**
 * Run an approximate query.
 */
export async function runApproxQuery(params) {
  const res = await api.post("/api/query/approximate", params);
  return res.data;
}

/**
 * Run both queries and get a side-by-side comparison.
 */
export async function runCompareQuery(params) {
  const res = await api.post("/api/query/compare", params);
  return res.data;
}

/**
 * Run benchmarks across multiple accuracy levels.
 */
export async function runBenchmark(params) {
  const res = await api.post("/api/benchmark", params);
  return res.data;
}

/**
 * Create a WebSocket connection for streaming data.
 * Returns the WebSocket instance.
 */
export function createStreamSocket(onMessage, onError) {
  const ws = new WebSocket("ws://localhost:8000/ws/stream");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    if (onError) onError(error);
  };

  return ws;
}
