"""
exact_engine.py
----------------
Executes EXACT analytical queries using DuckDB.

DuckDB is an in-process analytical database (like SQLite but for analytics).
It reads Parquet files directly and runs SQL queries very fast.

This module provides the "ground truth" results that we compare our
approximate results against.
"""

import time
import duckdb
import pandas as pd
from typing import Optional, Dict, Any


class ExactEngine:
    """
    Exact query engine powered by DuckDB.
    Supports multiple tables for simultaneous analysis and joins.
    """

    def __init__(self, initial_parquet_path: Optional[str] = None):
        """
        Initialize the engine with an optional initial file.
        """
        self.conn = duckdb.connect(database=":memory:")
        self.tables = {} # table_name -> row_count
        
        if initial_parquet_path:
            self.add_source("data_1", initial_parquet_path, is_csv=False)

    def add_source(self, table_name: str, file_path: str, is_csv: bool = True):
        """Register a new file as a SQL table."""
        print(f"🔄 Loading {table_name} from {file_path}")
        escaped_path = file_path.replace(chr(92), '/')
        
        self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        if is_csv:
            self.conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{escaped_path}', header=True, ignore_errors=true)")
        else:
            self.conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_parquet('{escaped_path}')")
            
        count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        self.tables[table_name] = count
        return count

    def count(self, column: str = "*", where: Optional[str] = None, table_name: str = "data_1", table_b: Optional[str] = None, join_key: Optional[str] = None) -> Dict[str, Any]:
        """Run an exact COUNT query with optional join."""
        where_clause = f"WHERE {where}" if where else ""
        col_safe = f'"{table_name}"."{column}"' if column != "*" else "*"
        
        if table_b and join_key:
            sql = f'SELECT COUNT({col_safe}) FROM "{table_name}" JOIN "{table_b}" ON "{table_name}"."{join_key}" = "{table_b}"."{join_key}" {where_clause}'
            total_rows = self.tables.get(table_name, 0) # Base table for memory reporting
        else:
            sql = f'SELECT COUNT({col_safe}) FROM "{table_name}" {where_clause}'
            total_rows = self.tables.get(table_name, 0)

        start = time.perf_counter()
        result = self.conn.execute(sql).fetchone()[0]
        elapsed = time.perf_counter() - start

        return {
            "query_type": "COUNT",
            "sql": sql,
            "result": int(result),
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": total_rows * 104,
            "engine": "exact",
        }

    def count_distinct(self, column: str, where: Optional[str] = None, table_name: str = "data_1", table_b: Optional[str] = None, join_key: Optional[str] = None) -> Dict[str, Any]:
        """Run an exact COUNT DISTINCT query with optional join."""
        where_clause = f"WHERE {where}" if where else ""
        col_safe = f'"{table_name}"."{column}"'
        
        if table_b and join_key:
            sql = f'SELECT COUNT(DISTINCT {col_safe}) FROM "{table_name}" JOIN "{table_b}" ON "{table_name}"."{join_key}" = "{table_b}"."{join_key}" {where_clause}'
        else:
            sql = f'SELECT COUNT(DISTINCT {col_safe}) FROM "{table_name}" {where_clause}'

        start = time.perf_counter()
        result = self.conn.execute(sql).fetchone()[0]
        elapsed = time.perf_counter() - start

        return {
            "query_type": "COUNT_DISTINCT",
            "sql": sql,
            "result": int(result),
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.tables.get(table_name, 0) * 104,
            "engine": "exact",
        }

    def sum(self, column: str, where: Optional[str] = None, table_name: str = "data_1", table_b: Optional[str] = None, join_key: Optional[str] = None) -> Dict[str, Any]:
        """Run an exact SUM query with graceful type coercion and optional join."""
        where_clause = f"WHERE {where}" if where else ""
        col_safe = f'TRY_CAST("{table_name}"."{column}" AS DOUBLE)'
        
        if table_b and join_key:
            sql = f'SELECT SUM({col_safe}) FROM "{table_name}" JOIN "{table_b}" ON "{table_name}"."{join_key}" = "{table_b}"."{join_key}" {where_clause}'
        else:
            sql = f'SELECT SUM({col_safe}) FROM "{table_name}" {where_clause}'

        start = time.perf_counter()
        result = self.conn.execute(sql).fetchone()[0]
        elapsed = time.perf_counter() - start

        return {
            "query_type": "SUM",
            "sql": sql,
            "result": round(float(result), 2) if result else 0,
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.tables.get(table_name, 0) * 104,
            "engine": "exact",
        }

    def avg(self, column: str, where: Optional[str] = None, table_name: str = "data_1", table_b: Optional[str] = None, join_key: Optional[str] = None) -> Dict[str, Any]:
        """Run an exact AVG query with graceful type coercion and optional join."""
        where_clause = f"WHERE {where}" if where else ""
        col_safe = f'TRY_CAST("{table_name}"."{column}" AS DOUBLE)'
        
        if table_b and join_key:
            sql = f'SELECT AVG({col_safe}) FROM "{table_name}" JOIN "{table_b}" ON "{table_name}"."{join_key}" = "{table_b}"."{join_key}" {where_clause}'
        else:
            sql = f'SELECT AVG({col_safe}) FROM "{table_name}" {where_clause}'

        start = time.perf_counter()
        result = self.conn.execute(sql).fetchone()[0]
        elapsed = time.perf_counter() - start

        return {
            "query_type": "AVG",
            "sql": sql,
            "result": round(float(result), 2) if result else 0,
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.tables.get(table_name, 0) * 104,
            "engine": "exact",
        }

    def group_by(
        self,
        group_column: str,
        agg_column: str,
        agg_func: str = "AVG",
        where: Optional[str] = None,
        table_name: str = "data_1",
        table_b: Optional[str] = None,
        join_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Run an exact GROUP BY query with optional join."""
        where_clause = f"WHERE {where}" if where else ""
        g_safe = f'"{table_name}"."{group_column}"'
        
        if agg_func.upper() in ["AVG", "SUM"]:
            a_safe = f'TRY_CAST("{table_name}"."{agg_column}" AS DOUBLE)'
        else:
            a_safe = f'"{table_name}"."{agg_column}"' if agg_column != "*" else "*"
            
        if table_b and join_key:
            sql = (
                f"SELECT {g_safe}, {agg_func}({a_safe}) as agg_value "
                f'FROM "{table_name}" JOIN "{table_b}" ON "{table_name}"."{join_key}" = "{table_b}"."{join_key}" '
                f"{where_clause} GROUP BY {g_safe} ORDER BY {g_safe}"
            )
        else:
            sql = (
                f"SELECT {g_safe}, {agg_func}({a_safe}) as agg_value "
                f'FROM "{table_name}" {where_clause} '
                f"GROUP BY {g_safe} ORDER BY {g_safe}"
            )

        start = time.perf_counter()
        rows = self.conn.execute(sql).fetchall()
        elapsed = time.perf_counter() - start

        result = {str(row[0]): round(float(row[1]), 2) if row[1] is not None else 0 for row in rows}

        return {
            "query_type": "GROUP_BY",
            "sql": sql,
            "result": result,
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.tables.get(table_name, 0) * 104,
            "engine": "exact",
        }

    def get_columns(self, table_name: str = "data_1"):
        """Return columns for a specific table."""
        if table_name not in self.tables:
            return []
        info = self.conn.execute(f'DESCRIBE "{table_name}"').fetchall()
        return [{"name": row[0], "type": row[1]} for row in info]

    def get_sample_rows(self, n: int = 5, table_name: str = "data_1"):
        """Return sample rows for a specific table."""
        if table_name not in self.tables:
            return []
        rows = self.conn.execute(
            f'SELECT * FROM "{table_name}" LIMIT {n}'
        ).fetchdf()
        return rows.to_dict(orient="records")

    def get_dataframe(self, table_name: str = "data_1") -> pd.DataFrame:
        """Return the full dataset for a specific table."""
        return self.conn.execute(f'SELECT * FROM "{table_name}"').fetchdf()
