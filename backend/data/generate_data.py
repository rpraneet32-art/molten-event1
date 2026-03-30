"""
generate_data.py
-----------------
Generates a synthetic e-commerce transactions dataset with 1M+ rows
and saves it as a Parquet file for DuckDB to query.

Columns:
  - transaction_id : unique ID (int)
  - user_id        : user identifier (int, ~50K unique users)
  - product_category : one of 10 categories
  - amount         : transaction amount (float, 1-500)
  - quantity        : items purchased (int, 1-10)
  - region         : one of 6 regions
  - timestamp      : datetime within the last 365 days
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ──────────────────── Configuration ────────────────────
NUM_ROWS = 1_200_000  # 1.2 million rows
NUM_USERS = 50_000

CATEGORIES = [
    "Electronics", "Clothing", "Home & Kitchen", "Books",
    "Sports", "Beauty", "Toys", "Grocery", "Automotive", "Health"
]

REGIONS = ["North", "South", "East", "West", "Central", "International"]

# Category weights (Electronics and Clothing are more popular)
CATEGORY_WEIGHTS = [0.20, 0.18, 0.12, 0.10, 0.10, 0.08, 0.07, 0.06, 0.05, 0.04]

# Region weights
REGION_WEIGHTS = [0.25, 0.20, 0.18, 0.17, 0.12, 0.08]


def generate_dataset(num_rows: int = NUM_ROWS, seed: int = 42) -> pd.DataFrame:
    """Generate a synthetic e-commerce dataset."""
    rng = np.random.default_rng(seed)

    # Generate timestamps over the last 365 days
    end_date = datetime(2026, 3, 30)
    start_date = end_date - timedelta(days=365)
    timestamps = pd.to_datetime(
        rng.integers(
            int(start_date.timestamp()),
            int(end_date.timestamp()),
            size=num_rows
        ),
        unit="s"
    )

    df = pd.DataFrame({
        "transaction_id": np.arange(1, num_rows + 1),
        "user_id": rng.integers(1, NUM_USERS + 1, size=num_rows),
        "product_category": rng.choice(CATEGORIES, size=num_rows, p=CATEGORY_WEIGHTS),
        "amount": np.round(rng.exponential(scale=75.0, size=num_rows) + 1.0, 2),
        "quantity": rng.integers(1, 11, size=num_rows),
        "region": rng.choice(REGIONS, size=num_rows, p=REGION_WEIGHTS),
        "timestamp": timestamps,
    })

    # Clip amount to a realistic range
    df["amount"] = df["amount"].clip(1.0, 999.99)

    return df


def save_dataset(df: pd.DataFrame, output_dir: str = None):
    """Save the dataset as a Parquet file."""
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))

    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "transactions.parquet")
    df.to_parquet(path, index=False, engine="pyarrow")
    print(f"✅ Saved {len(df):,} rows to {path}")
    return path


if __name__ == "__main__":
    print("Generating synthetic e-commerce dataset...")
    df = generate_dataset()
    print(f"  Rows: {len(df):,}")
    print(f"  Columns: {list(df.columns)}")
    print(f"  Unique users: {df['user_id'].nunique():,}")
    print(f"  Categories: {df['product_category'].nunique()}")
    save_dataset(df)
