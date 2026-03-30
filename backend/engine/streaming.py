"""
streaming.py
-------------
Real-time streaming analytics engine.

Simulates a live data stream (as if transactions are arriving in real-time)
and maintains running approximate aggregates using sketches.

This covers the "Brownie Point: Real-time analytics" requirement.

How it works:
  1. A background generator produces new synthetic transactions every 100ms.
  2. Each new transaction is fed into running sketches:
     - HyperLogLog for tracking unique users in real-time.
     - Count-Min Sketch for tracking category frequencies.
     - Running mean/sum via incremental formulas.
  3. Every second, a WebSocket message is sent to the frontend with
     updated approximate aggregates.
"""

import asyncio
import json
import time
import numpy as np
from typing import Dict, Any
from engine.sketches.count_min_sketch import CountMinSketch
from engine.sketches.hll_wrapper import HLLCounter


CATEGORIES = [
    "Electronics", "Clothing", "Home & Kitchen", "Books",
    "Sports", "Beauty", "Toys", "Grocery", "Automotive", "Health"
]

REGIONS = ["North", "South", "East", "West", "Central", "International"]


class StreamingEngine:
    """
    Maintains running approximate aggregates over a simulated data stream.
    """

    def __init__(self):
        self.reset()

    def reset(self):
        """Reset all running state."""
        self.hll = HLLCounter(precision=12)
        self.cms = CountMinSketch(width=5000, depth=5)
        self.total_count = 0
        self.running_sum = 0.0
        self.running_mean = 0.0
        self.transactions_per_second = 0
        self._second_counter = 0
        self._last_second = time.time()
        self.history = []  # Store last 60 data points for charts

    def ingest(self, transaction: Dict[str, Any]):
        """
        Process a single incoming transaction.

        Updates all running sketches and aggregates.
        """
        self.total_count += 1
        self._second_counter += 1

        # Update HyperLogLog for unique user count
        self.hll.add(transaction["user_id"])

        # Update Count-Min Sketch for category frequency
        self.cms.add(transaction["product_category"])

        # Update running mean (Welford's online algorithm)
        amount = transaction["amount"]
        self.running_sum += amount
        self.running_mean += (amount - self.running_mean) / self.total_count

        # Track TPS
        now = time.time()
        if now - self._last_second >= 1.0:
            self.transactions_per_second = self._second_counter
            self._second_counter = 0
            self._last_second = now

    def get_snapshot(self) -> Dict[str, Any]:
        """
        Get current approximate aggregates snapshot.
        Sent to frontend via WebSocket.
        """
        # Get category counts from CMS
        category_counts = {}
        for cat in CATEGORIES:
            category_counts[cat] = self.cms.estimate(cat)

        snapshot = {
            "timestamp": time.time(),
            "total_transactions": self.total_count,
            "unique_users": self.hll.estimate_cardinality(),
            "running_avg_amount": round(self.running_mean, 2),
            "running_total_amount": round(self.running_sum, 2),
            "transactions_per_second": self.transactions_per_second,
            "category_distribution": category_counts,
        }

        # Keep history for charts (last 60 snapshots)
        self.history.append(snapshot)
        if len(self.history) > 60:
            self.history = self.history[-60:]

        return snapshot


def generate_transaction(rng: np.random.Generator) -> Dict[str, Any]:
    """Generate a single random transaction (simulates real-time data arrival)."""

    category_weights = [0.20, 0.18, 0.12, 0.10, 0.10, 0.08, 0.07, 0.06, 0.05, 0.04]
    region_weights = [0.25, 0.20, 0.18, 0.17, 0.12, 0.08]

    return {
        "user_id": int(rng.integers(1, 50001)),
        "product_category": rng.choice(CATEGORIES, p=category_weights),
        "amount": round(float(rng.exponential(75.0) + 1.0), 2),
        "quantity": int(rng.integers(1, 11)),
        "region": rng.choice(REGIONS, p=region_weights),
    }


async def stream_data(websocket, engine: StreamingEngine):
    """
    Main streaming loop.
    Generates transactions and pushes snapshots via WebSocket.

    Runs until the WebSocket is closed.
    """
    rng = np.random.default_rng()
    batch_size = 50  # Process 50 transactions per tick

    try:
        while True:
            # Generate and ingest a batch of transactions
            for _ in range(batch_size):
                txn = generate_transaction(rng)
                engine.ingest(txn)

            # Send snapshot to frontend
            snapshot = engine.get_snapshot()
            await websocket.send_json(snapshot)

            # Wait 500ms before next batch (100 TPS effective rate)
            await asyncio.sleep(0.5)

    except Exception:
        # WebSocket disconnected or error — stop gracefully
        pass
