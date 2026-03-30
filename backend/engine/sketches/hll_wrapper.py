"""
hll_wrapper.py
---------------
Wrapper around the `datasketch` library's HyperLogLog implementation.

HyperLogLog (HLL) is a probabilistic data structure for estimating
the number of DISTINCT elements (cardinality) in a dataset.

How it works (simplified):
  1. Hash each element to a binary string.
  2. Count the number of leading zeros in each hash.
  3. The more leading zeros you observe, the more distinct elements you likely have.
  4. Uses multiple "registers" (buckets) and harmonic mean to reduce variance.

Key property:
  - Uses only O(log log n) space to count n distinct elements.
  - With 16 bits of precision, it uses ~64 KB and has ~0.4% error.

Precision ↔ Accuracy mapping:
  - precision 4  → 16 registers   → ~26% error  (very fast, least memory)
  - precision 8  → 256 registers  → ~6.5% error
  - precision 12 → 4096 registers → ~1.6% error
  - precision 16 → 65536 registers → ~0.4% error (most accurate)
"""

from datasketch import HyperLogLog


class HLLCounter:
    """
    HyperLogLog wrapper for COUNT DISTINCT estimation.

    Parameters
    ----------
    precision : int
        Number of precision bits (4-16). Higher = more accurate but more memory.
        Default is 14 (~1% error).
    """

    def __init__(self, precision: int = 14):
        self.precision = max(4, min(16, precision))
        self.hll = HyperLogLog(p=self.precision)
        self.items_added = 0

    def add(self, item):
        """Add an item to the HLL counter."""
        self.hll.update(str(item).encode("utf-8"))
        self.items_added += 1

    def add_batch(self, items):
        """Add multiple items at once."""
        for item in items:
            self.add(item)

    def estimate_cardinality(self) -> int:
        """
        Estimate the number of distinct elements.

        Returns
        -------
        int : estimated count of distinct elements
        """
        return int(self.hll.count())

    def get_relative_error(self) -> float:
        """
        Get the expected relative error for the current precision.
        Formula: 1.04 / sqrt(2^precision)
        """
        import math
        return 1.04 / math.sqrt(2 ** self.precision)

    @classmethod
    def from_accuracy_target(cls, accuracy: float = 0.95):
        """
        Create an HLL counter calibrated to the desired accuracy.

        Parameters
        ----------
        accuracy : float
            Desired accuracy (0.80 to 0.99).
            Higher accuracy → higher precision → more memory.

        Returns
        -------
        HLLCounter
        """
        # Map accuracy to precision bits
        # accuracy 0.80 → precision 6  (~10% error)
        # accuracy 0.90 → precision 10 (~3% error)
        # accuracy 0.95 → precision 12 (~1.6% error)
        # accuracy 0.99 → precision 16 (~0.4% error)
        import math

        # Target error = 1 - accuracy
        target_error = 1.0 - accuracy
        # From formula: error ≈ 1.04 / sqrt(2^p)
        # So: 2^p ≈ (1.04 / error)^2
        # p ≈ 2 * log2(1.04 / error)
        if target_error <= 0:
            precision = 16
        else:
            precision = int(math.ceil(2 * math.log2(1.04 / target_error)))

        precision = max(4, min(16, precision))
        return cls(precision=precision)
