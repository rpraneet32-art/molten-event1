import React, { useState } from "react";
import AccuracySlider from "./AccuracySlider";
import ResultsComparison from "./ResultsComparison";
import { runCompareQuery } from "../utils/api";

/**
 * QueryBuilder
 * -------------
 * Provides a UI for users to build SQL-like analytical queries.
 * Supports: COUNT, COUNT DISTINCT, SUM, AVG, GROUP BY
 * Sends the query to backend and displays results via ResultsComparison.
 */

const QUERY_TYPES = [
  { value: "count", label: "COUNT", description: "Count total rows" },
  { value: "count_distinct", label: "COUNT DISTINCT", description: "Count unique values" },
  { value: "sum", label: "SUM", description: "Sum of a numeric column" },
  { value: "avg", label: "AVG", description: "Average of a numeric column" },
  { value: "group_by", label: "GROUP BY", description: "Aggregate grouped by a column" },
];

const NUMERIC_COLS = ["amount", "quantity"];
const ALL_COLS = ["user_id", "product_category", "amount", "quantity", "region", "timestamp"];
const GROUP_COLS = ["product_category", "region"];
const AGG_FUNCS = ["AVG", "SUM", "COUNT"];

export default function QueryBuilder() {
  const [queryType, setQueryType] = useState("avg");
  const [column, setColumn] = useState("amount");
  const [whereClause, setWhereClause] = useState("");
  const [groupByColumn, setGroupByColumn] = useState("product_category");
  const [aggFunc, setAggFunc] = useState("AVG");
  const [accuracy, setAccuracy] = useState(0.95);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const params = {
        query_type: queryType,
        column: queryType === "count" ? "*" : column,
        where: whereClause || null,
        group_by_column: queryType === "group_by" ? groupByColumn : null,
        agg_func: queryType === "group_by" ? aggFunc : "AVG",
        accuracy_target: accuracy,
      };

      const data = await runCompareQuery(params);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to run query");
    } finally {
      setLoading(false);
    }
  };

  // Build the SQL preview string
  const getSqlPreview = () => {
    let sql = "SELECT ";
    switch (queryType) {
      case "count":
        sql += "COUNT(*)";
        break;
      case "count_distinct":
        sql += `COUNT(DISTINCT ${column})`;
        break;
      case "sum":
        sql += `SUM(${column})`;
        break;
      case "avg":
        sql += `AVG(${column})`;
        break;
      case "group_by":
        sql += `${groupByColumn}, ${aggFunc}(${column})`;
        break;
    }
    sql += " FROM transactions";
    if (whereClause) sql += ` WHERE ${whereClause}`;
    if (queryType === "group_by") sql += ` GROUP BY ${groupByColumn}`;
    return sql;
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h2 className="section-title">⚡ Query Engine</h2>
        <p className="text-gray-400 mt-2 text-sm">
          Run SQL-like analytical queries and compare exact vs approximate results side-by-side.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Form */}
        <div className="lg:col-span-2 glass-card p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Query Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Query Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {QUERY_TYPES.map((qt) => (
                  <button
                    key={qt.value}
                    type="button"
                    onClick={() => setQueryType(qt.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                      queryType === qt.value
                        ? "bg-primary-500/15 text-primary-400 border-primary-500/30 shadow-lg shadow-primary-500/10"
                        : "bg-surface-900/50 text-gray-400 border-white/5 hover:border-white/15 hover:text-gray-300"
                    }`}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Selection */}
            {queryType !== "count" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Column
                  </label>
                  <select
                    value={column}
                    onChange={(e) => setColumn(e.target.value)}
                    className="input-field"
                  >
                    {(queryType === "count_distinct" ? ALL_COLS : NUMERIC_COLS).map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                {queryType === "group_by" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Group By
                      </label>
                      <select
                        value={groupByColumn}
                        onChange={(e) => setGroupByColumn(e.target.value)}
                        className="input-field"
                      >
                        {GROUP_COLS.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Aggregation
                      </label>
                      <select
                        value={aggFunc}
                        onChange={(e) => setAggFunc(e.target.value)}
                        className="input-field"
                      >
                        {AGG_FUNCS.map((fn) => (
                          <option key={fn} value={fn}>{fn}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* WHERE Clause */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                WHERE Clause <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={whereClause}
                onChange={(e) => setWhereClause(e.target.value)}
                placeholder="e.g. region = 'North' or amount > 100"
                className="input-field font-mono text-sm"
              />
            </div>

            {/* SQL Preview */}
            <div className="bg-surface-900/80 rounded-xl p-4 border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">SQL Preview</p>
              <code className="text-sm font-mono text-primary-400">{getSqlPreview()}</code>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Running...
                </>
              ) : (
                <>Run Query ⚡</>
              )}
            </button>
          </form>
        </div>

        {/* Accuracy Slider Sidebar */}
        <div>
          <AccuracySlider value={accuracy} onChange={setAccuracy} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/5">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      {result && <ResultsComparison data={result} />}
    </div>
  );
}
