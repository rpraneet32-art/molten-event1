"""
main.py
--------
FastAPI application — the main entry point for the backend.

Endpoints:
  POST /api/query/exact       → Run an exact query via DuckDB
  POST /api/query/approximate → Run an approximate query via sketches
  POST /api/query/compare     → Run both and return side-by-side comparison
  POST /api/benchmark         → Run speed/accuracy benchmarks
  GET  /api/data/info         → Dataset metadata
  WS   /ws/stream             → Real-time streaming analytics

Run with:
  cd backend
  uvicorn main:app --reload --port 8000
"""

import os
import time
import shutil
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data.generate_data import generate_dataset, save_dataset
from engine.exact_engine import ExactEngine
from engine.approx_engine import ApproxEngine
from engine.streaming import StreamingEngine, stream_data

# ──────────────────── App Setup ────────────────────
app = FastAPI(
    title="Approximate Query Engine",
    description="High-Speed Analytical Insights with Approximate Query Processing",
    version="1.0.0",
)

# Allow frontend to connect (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────── Data Loading ────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PARQUET_PATH = os.path.join(DATA_DIR, "transactions.parquet")

# Generate data if it doesn't exist yet
if not os.path.exists(PARQUET_PATH):
    print("📊 Generating synthetic dataset (first time only)...")
    df = generate_dataset()
    save_dataset(df, DATA_DIR)

# Initialize engines - Registry for multi-source support
exact_engine = ExactEngine(PARQUET_PATH)
# Helper to get the full Dataframe for Approx Engine (wrapped in a dict for registry)
SOURCES = {
    "data_1": {
        "name": "Default Sample",
        "filename": "transactions.parquet",
        "rows": exact_engine.tables.get("data_1")
    }
}

# Streaming engine (shared state for WebSocket connections)
streaming_engine = StreamingEngine()


# ──────────────────── Request Models ────────────────────
class QueryRequest(BaseModel):
    """Request body for query endpoints."""

    query_type: str  # "count", "count_distinct", "sum", "avg", "group_by"
    column: str = "*"  # Column to aggregate
    source_id_a: str = "data_1" # Primary Table
    source_id_b: Optional[str] = None # Secondary Table for JOIN
    join_key: Optional[str] = None # Common column for JOIN
    where: Optional[str] = None  # WHERE clause (e.g., "region = 'North'")
    group_by_column: Optional[str] = None  # For GROUP BY queries
    agg_func: Optional[str] = "AVG"  # For GROUP BY: AVG, SUM, COUNT
    accuracy_target: float = 0.95  # 0.80 to 0.99

class BenchmarkRequest(BaseModel):
    """Request body for benchmark endpoint."""

    accuracy_levels: list = [0.80, 0.85, 0.90, 0.95, 0.99]
    query_types: list = ["count_distinct", "sum", "avg"]
    column: str = "amount"
    iterations: int = 3


# ──────────────────── Endpoints ────────────────────


@app.get("/")
def root():
    """Health check."""
    return {"status": "ok", "message": "Approximate Query Engine API"}


@app.get("/api/data/info")
def data_info():
    """Return metadata for all active data sources."""
    sources_info = {}
    for sid in exact_engine.tables:
        sources_info[sid] = {
            "name": SOURCES.get(sid, {}).get("name", sid),
            "total_rows": exact_engine.tables[sid],
            "columns": exact_engine.get_columns(sid),
            "sample_rows": exact_engine.get_sample_rows(5, sid),
        }
    return {"sources": sources_info}

@app.post("/api/upload")
def upload_dataset(file: UploadFile = File(...)):
    """Upload a custom CSV/parquet file as a new data source."""
    global exact_engine
    
    try:
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in ["csv", "parquet"]:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Only .csv or .parquet files are supported.")
            
        # Create a unique ID for this source
        source_id = f"data_{len(exact_engine.tables) + 1}"
        upload_path = os.path.join(DATA_DIR, file.filename)
        
        # Save file
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"📥 Received file {file.filename}, adding to registry as {source_id}")
        
        # 1. Add to Exact Engine
        row_count = exact_engine.add_source(source_id, upload_path, is_csv=(file_ext == "csv"))
        
        # 2. Update Registry
        SOURCES[source_id] = {
            "name": file.filename,
            "filename": file.filename,
            "rows": row_count
        }
        
        return {
            "status": "success",
            "source_id": source_id,
            "message": f"Successfully loaded {file.filename} as {source_id} ({row_count} rows).",
            "columns": exact_engine.get_columns(source_id)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Data Load Error: {str(e)}")

@app.post("/api/data/reset")
def reset_dataset():
    """Reset the engine to factory defaults."""
    global exact_engine, SOURCES
    
    print("🔄 Resetting registry...")
    exact_engine = ExactEngine(PARQUET_PATH)
    SOURCES = {
        "data_1": {
            "name": "Default Sample",
            "filename": "transactions.parquet",
            "rows": exact_engine.tables.get("data_1")
        }
    }
    
    return {
        "status": "success",
        "message": "Successfully reset to sample dataset.",
        "columns": exact_engine.get_columns("data_1")
    }

@app.post("/api/query/exact")
def run_exact_query(req: QueryRequest):
    """Run an exact query using DuckDB."""
    return _dispatch_query(req, engine_type="exact")


@app.post("/api/query/approximate")
def run_approximate_query(req: QueryRequest):
    """Run an approximate query using probabilistic data structures."""
    return _dispatch_query(req, engine_type="approximate")


@app.post("/api/query/compare")
def run_comparison_query(req: QueryRequest):
    """Run both exact and approximate queries and return side-by-side results."""
    try:
        exact_result = _dispatch_query(req, engine_type="exact")
        approx_result = _dispatch_query(req, engine_type="approximate")

        # Calculate accuracy and speedup
        exact_val = exact_result.get("result", 0)
        approx_val = approx_result.get("result", 0)

        if isinstance(exact_val, dict) and isinstance(approx_val, dict):
            # GROUP BY: compute average error across groups
            errors = []
            for key in exact_val:
                if key in approx_val and exact_val[key] != 0:
                    error = abs(exact_val[key] - approx_val[key]) / abs(exact_val[key]) * 100
                    errors.append(error)
            error_pct = round(sum(errors) / len(errors), 2) if errors else 0
        elif exact_val != 0:
            error_pct = round(abs(exact_val - approx_val) / abs(exact_val) * 100, 2)
        else:
            error_pct = 0

        exact_time = exact_result.get("time_ms", 1)
        approx_time = approx_result.get("time_ms", 1)
        speedup = round(exact_time / max(approx_time, 0.01), 2)

        exact_mem = exact_result.get("memory_bytes", 1)
        approx_mem = approx_result.get("memory_bytes", 1)

        return {
            "exact": exact_result,
            "approximate": approx_result,
            "comparison": {
                "error_pct": error_pct,
                "accuracy_pct": round(100 - error_pct, 2),
                "speedup": speedup,
                "exact_time_ms": exact_time,
                "approx_time_ms": approx_time,
                "exact_memory_bytes": exact_mem,
                "approx_memory_bytes": approx_mem,
            },
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        # Return a 400 so the UI shows a red error message instead of a generic "Network Error"
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/benchmark")
def run_benchmark(req: BenchmarkRequest):
    """
    Run benchmarks across multiple accuracy levels.
    Returns speed and accuracy data for charts.
    """
    results = []

    for accuracy in req.accuracy_levels:
        for query_type in req.query_types:
            times_exact = []
            times_approx = []
            errors = []

            for _ in range(req.iterations):
                query_req = QueryRequest(
                    query_type=query_type,
                    column=req.column,
                    accuracy_target=accuracy,
                )
                comparison = run_comparison_query(query_req)

                times_exact.append(comparison["exact"]["time_ms"])
                times_approx.append(comparison["approximate"]["time_ms"])
                errors.append(comparison["comparison"]["error_pct"])

            results.append({
                "accuracy_target": accuracy,
                "query_type": query_type,
                "avg_exact_time_ms": round(sum(times_exact) / len(times_exact), 2),
                "avg_approx_time_ms": round(sum(times_approx) / len(times_approx), 2),
                "avg_error_pct": round(sum(errors) / len(errors), 2),
                "avg_speedup": round(
                    (sum(times_exact) / len(times_exact))
                    / max(sum(times_approx) / len(times_approx), 0.01),
                    2,
                ),
            })

    return {"benchmarks": results}


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time streaming analytics.
    Connects the frontend to a live data stream with approximate aggregates.
    """
    await websocket.accept()
    engine = StreamingEngine()

    try:
        await stream_data(websocket, engine)
    except WebSocketDisconnect:
        pass


# ──────────────────── Internal Helpers ────────────────────


def _dispatch_query(req: QueryRequest, engine_type: str) -> dict:
    """Route a query request to the right engine and method, supporting multi-source and joins."""
    query_type = req.query_type.lower().strip()
    source_a = req.source_id_a
    source_b = req.source_id_b # Optional
    join_key = req.join_key # Optional

    if engine_type == "exact":
        engine = exact_engine
        if query_type == "count":
            return engine.count(req.column, req.where, table_name=source_a, table_b=source_b, join_key=join_key)
        elif query_type == "count_distinct":
            return engine.count_distinct(req.column, req.where, table_name=source_a, table_b=source_b, join_key=join_key)
        elif query_type == "sum":
            return engine.sum(req.column, req.where, table_name=source_a, table_b=source_b, join_key=join_key)
        elif query_type == "avg":
            return engine.avg(req.column, req.where, table_name=source_a, table_b=source_b, join_key=join_key)
        elif query_type == "group_by":
            return engine.group_by(
                req.group_by_column or "product_category",
                req.column,
                req.agg_func or "AVG",
                req.where,
                table_name=source_a,
                table_b=source_b,
                join_key=join_key
            )
    else:
        # Approximate Join logic: For smoothness, we join the samples if it's a join query
        if source_b and join_key:
            df_a = exact_engine.get_dataframe(source_a)
            df_b = exact_engine.get_dataframe(source_b)
            # Create a joined dataframe sample for approximation
            # We sample both then join to maintain performance
            joined_df = df_a.merge(df_b, on=join_key)
            engine = ApproxEngine(joined_df, accuracy_target=req.accuracy_target)
        else:
            df_a = exact_engine.get_dataframe(source_a)
            engine = ApproxEngine(df_a, accuracy_target=req.accuracy_target)

        if query_type == "count":
            return engine.count(req.column, req.where)
        elif query_type == "count_distinct":
            return engine.count_distinct(req.column, req.where)
        elif query_type == "sum":
            return engine.sum(req.column, req.where)
        elif query_type == "avg":
            return engine.avg(req.column, req.where)
        elif query_type == "group_by":
            return engine.group_by(
                req.group_by_column or "product_category",
                req.column,
                req.agg_func or "AVG",
                req.where,
            )

    return {"error": f"Unknown query type: {query_type}"}
