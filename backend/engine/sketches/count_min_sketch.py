"""
count_min_sketch.py
--------------------
Custom implementation of the Count-Min Sketch data structure.

A Count-Min Sketch is a probabilistic data structure that estimates
the frequency (count) of items in a stream using sub-linear space.

How it works:
  1. We create a 2D array of counters with `depth` rows and `width` columns.
  2. Each row uses a different hash function.
  3. When we ADD an item, we hash it with each row's hash function
     and increment the corresponding counter.
  4. When we QUERY an item, we take the MINIMUM count across all rows —
     this gives an upper-bound estimate that's often very close to the true count.

Key property: It NEVER under-counts, but it may over-count.
"""

import hashlib
import numpy as np


class CountMinSketch:
    """
    Count-Min Sketch for frequency estimation.

    Parameters
    ----------
    width : int
        Number of columns (higher = more accurate, more memory).
    depth : int
        Number of hash functions / rows (higher = fewer collisions).
    """

    def __init__(self, width: int = 10000, depth: int = 7):
        self.width = width
        self.depth = depth
        self.table = np.zeros((depth, width), dtype=np.int64)
        self.total_count = 0

        # Pre-generate random seeds for each hash function
        self._seeds = [i * 1337 + 42 for i in range(depth)]

    def _hash(self, item: str, seed: int) -> int:
        """
        Generate a hash index for the given item and seed.
        Uses MD5 for good distribution, combined with a seed for independence.
        """
        key = f"{seed}:{item}".encode("utf-8")
        h = int(hashlib.md5(key).hexdigest(), 16)
        return h % self.width

    def add(self, item: str, count: int = 1):
        """Add an item to the sketch (increment its count)."""
        self.total_count += count
        for i in range(self.depth):
            idx = self._hash(str(item), self._seeds[i])
            self.table[i][idx] += count

    def estimate(self, item: str) -> int:
        """
        Estimate the count of an item.
        Returns the minimum value across all hash function rows.
        """
        min_count = float("inf")
        for i in range(self.depth):
            idx = self._hash(str(item), self._seeds[i])
            min_count = min(min_count, self.table[i][idx])
        return int(min_count)

    def get_total_count(self) -> int:
        """Return the total number of items added."""
        return self.total_count

    @classmethod
    def from_accuracy(cls, epsilon: float = 0.001, delta: float = 0.01):
        """
        Create a CMS with desired accuracy guarantees.

        Parameters
        ----------
        epsilon : float
            Error factor. Estimates are within epsilon * N of true count
            with probability (1 - delta). Smaller = more accurate.
        delta : float
            Failure probability. Smaller = more reliable.

        Returns
        -------
        CountMinSketch
        """
        import math
        width = int(math.ceil(math.e / epsilon))
        depth = int(math.ceil(math.log(1.0 / delta)))
        return cls(width=width, depth=depth)
