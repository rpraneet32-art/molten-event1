"""
reservoir_sampling.py
----------------------
Custom implementation of Reservoir Sampling (Algorithm R by Vitter, 1985).

Reservoir Sampling lets you take a uniform random sample of exactly `k` items
from a stream of unknown or very large size `n`, in a single pass.

How it works:
  1. Fill the reservoir with the first `k` items.
  2. For each subsequent item at position `i` (where i > k):
     - Generate a random number `j` between 0 and i (inclusive).
     - If `j < k`, replace reservoir[j] with the new item.
  3. After processing all items, the reservoir contains a uniform random sample.

Why it's useful for AQP:
  - To estimate AVG, we compute the mean of the sample → it's an unbiased estimator.
  - To estimate SUM, we compute (sample mean × total count).
  - To estimate GROUP BY, we split the sample by group and aggregate each.
"""

import numpy as np
from typing import List, Optional


class ReservoirSampler:
    """
    Reservoir Sampling for maintaining a fixed-size random sample from a stream.

    Parameters
    ----------
    sample_size : int
        The number of items to keep in the reservoir (k).
    """

    def __init__(self, sample_size: int = 10000):
        self.sample_size = sample_size
        self.reservoir: List = []
        self.items_seen = 0

    def add(self, item):
        """
        Add an item to the reservoir using Algorithm R.

        If we've seen fewer than `sample_size` items, just append.
        Otherwise, randomly decide whether to include this item.
        """
        self.items_seen += 1

        if len(self.reservoir) < self.sample_size:
            # Phase 1: Fill the reservoir
            self.reservoir.append(item)
        else:
            # Phase 2: Randomly replace with decreasing probability
            j = np.random.randint(0, self.items_seen)
            if j < self.sample_size:
                self.reservoir[j] = item

    def add_batch(self, items):
        """Add multiple items at once (convenience method)."""
        for item in items:
            self.add(item)

    def get_sample(self) -> List:
        """Return the current reservoir sample."""
        return self.reservoir.copy()

    def estimate_avg(self, key: Optional[str] = None) -> float:
        """
        Estimate the average value.
        If items are dicts, provide the `key` to average on.
        """
        if not self.reservoir:
            return 0.0

        if key:
            values = [item[key] for item in self.reservoir if key in item]
        else:
            values = self.reservoir

        return float(np.mean(values)) if values else 0.0

    def estimate_sum(self, key: Optional[str] = None) -> float:
        """
        Estimate the total sum.
        Formula: sample_mean × total_items_seen
        """
        avg = self.estimate_avg(key)
        return avg * self.items_seen

    def estimate_count_where(self, predicate) -> int:
        """
        Estimate COUNT with a WHERE condition.
        Formula: (matching_in_sample / sample_size) × total_items_seen
        """
        if not self.reservoir:
            return 0

        matching = sum(1 for item in self.reservoir if predicate(item))
        ratio = matching / len(self.reservoir)
        return int(ratio * self.items_seen)

    def estimate_group_by(self, group_key: str, agg_key: str, agg_func: str = "avg"):
        """
        Estimate GROUP BY aggregation.

        Parameters
        ----------
        group_key : str
            The column to group by.
        agg_key : str
            The column to aggregate.
        agg_func : str
            "avg", "sum", or "count"

        Returns
        -------
        dict : {group_value: aggregated_value}
        """
        if not self.reservoir:
            return {}

        # Organize sample by groups
        groups = {}
        for item in self.reservoir:
            g = item.get(group_key, "Unknown")
            if g not in groups:
                groups[g] = []
            groups[g].append(item.get(agg_key, 0))

        # Scale factor for SUM and COUNT
        scale = self.items_seen / len(self.reservoir)

        result = {}
        for g, values in groups.items():
            if agg_func == "avg":
                result[g] = float(np.mean(values))
            elif agg_func == "sum":
                result[g] = float(np.sum(values) * scale)
            elif agg_func == "count":
                result[g] = int(len(values) * scale)

        return result

    @classmethod
    def from_accuracy_target(cls, total_rows: int, accuracy: float = 0.95):
        """
        Create a sampler with a sample size calibrated to the accuracy target.

        Higher accuracy → larger sample → slower but more accurate.
        At accuracy=0.99, we sample ~30% of data.
        At accuracy=0.80, we sample ~2% of data.
        """
        # Map accuracy (0.80 → 0.99) to sample fraction
        # Using a simple exponential mapping
        min_frac = 0.02   # 2% at accuracy=0.80
        max_frac = 0.30   # 30% at accuracy=0.99

        # Normalize accuracy to [0, 1] range within [0.80, 0.99]
        t = (accuracy - 0.80) / (0.99 - 0.80)
        t = max(0.0, min(1.0, t))

        # Exponential interpolation for smooth scaling
        fraction = min_frac * ((max_frac / min_frac) ** t)
        sample_size = max(1000, int(total_rows * fraction))
        sample_size = min(sample_size, total_rows)  # Can't sample more than we have

        return cls(sample_size=sample_size)
