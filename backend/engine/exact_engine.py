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
    Reads data from a Parquet file and runs full SQL queries.
    """

    def __init__(self, parquet_path: str):
        """
        Initialize the engine and load the Parquet file into DuckDB.

        Parameters
        ----------
        parquet_path : str
            Path to the transactions.parquet file.
        """
        self.parquet_path = parquet_path
        self.conn = duckdb.connect(database=":memory:")

        # Load Parquet into a DuckDB table for fast SQL queries
        self.conn.execute(f"""
            CREATE TABLE transactions AS
            SELECT * FROM read_parquet('{parquet_path.replace(chr(92), '/')}')
        """)

        # Cache row count
        result = self.conn.execute("SELECT COUNT(*) FROM transactions").fetchone()
        self.total_rows = result[0]

    def count(self, column: str = "*", where: Optional[str] = None) -> Dict[str, Any]:
        """
        Run an exact COUNT query.

        Example SQL: SELECT COUNT(*) FROM transactions WHERE region = 'North'
        """
        where_clause = f"WHERE {where}" if where else ""
        sql = f"SELECT COUNT({column}) FROM transactions {where_clause}"

        start = time.perf_counter()
        result = self.conn.execute(sql).fetchone()[0]
        elapsed = time.perf_counter() - start

        return {
            "query_type": "COUNT",
            "sql": sql,
            "result": int(result),
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.total_rows * 104,
            "engine": "exact",
        }

    def count_distinct(self, column: str, where: Optional[str] = None) -> Dict[str, Any]:
        """
        Run an exact COUNT DISTINCT query.

        Example SQL: SELECT COUNT(DISTINCT user_id) FROM transactions
        """
        where_clause = f"WHERE {where}" if where else ""
        sql = f"SELECT COUNT(DISTINCT {column}) FROM transactions {where_clause}"

        start = time.perf_counter()
        result = self.conn.execute(sql).fetchone()[0]
        elapsed = time.perf_counter() - start

        return {
            "query_type": "COUNT_DISTINCT",
            "sql": sql,
            "result": int(result),
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.total_rows * 104,
            "engine": "exact",
        }

    def sum(self, column: str, where: Optional[str] = None) -> Dict[str, Any]:
        """
        Run an exact SUM query.

        Example SQL: SELECT SUM(amount) FROM transactions
        """
        where_clause = f"WHERE {where}" if where else ""
        sql = f"SELECT SUM({column}) FROM transactions {where_clause}"

        start = time.perf_counter()
        result = self.conn.execute(sql).fetchone()[0]
        elapsed = time.perf_counter() - start

        return {
            "query_type": "SUM",
            "sql": sql,
            "result": round(float(result), 2) if result else 0,
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.total_rows * 104,
            "engine": "exact",
        }

    def avg(self, column: str, where: Optional[str] = None) -> Dict[str, Any]:
        """
        Run an exact AVG query.

        Example SQL: SELECT AVG(amount) FROM transactions
        """
        where_clause = f"WHERE {where}" if where else ""
        sql = f"SELECT AVG({column}) FROM transactions {where_clause}"

        start = time.perf_counter()
        result = self.conn.execute(sql).fetchone()[0]
        elapsed = time.perf_counter() - start

        return {
            "query_type": "AVG",
            "sql": sql,
            "result": round(float(result), 2) if result else 0,
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.total_rows * 104,
            "engine": "exact",
        }

    def group_by(
        self,
        group_column: str,
        agg_column: str,
        agg_func: str = "AVG",
        where: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run an exact GROUP BY query.

        Example SQL: SELECT region, AVG(amount) FROM transactions GROUP BY region
        """
        where_clause = f"WHERE {where}" if where else ""
        sql = (
            f"SELECT {group_column}, {agg_func}({agg_column}) as agg_value "
            f"FROM transactions {where_clause} "
            f"GROUP BY {group_column} ORDER BY {group_column}"
        )

        start = time.perf_counter()
        rows = self.conn.execute(sql).fetchall()
        elapsed = time.perf_counter() - start

        result = {str(row[0]): round(float(row[1]), 2) for row in rows}

        return {
            "query_type": "GROUP_BY",
            "sql": sql,
            "result": result,
            "time_ms": round(elapsed * 1000, 2),
            "memory_bytes": self.total_rows * 104,
            "engine": "exact",
        }

    def get_columns(self):
        """Return the column names and types of the transactions table."""
        info = self.conn.execute("DESCRIBE transactions").fetchall()
        return [{"name": row[0], "type": row[1]} for row in info]

    def get_sample_rows(self, n: int = 5):
        """Return a few sample rows for preview."""
        rows = self.conn.execute(
            f"SELECT * FROM transactions LIMIT {n}"
        ).fetchdf()
        return rows.to_dict(orient="records")

    def get_dataframe(self) -> pd.DataFrame:
        """Return the full dataset as a Pandas DataFrame (used by approx engine)."""
        return self.conn.execute("SELECT * FROM transactions").fetchdf()
