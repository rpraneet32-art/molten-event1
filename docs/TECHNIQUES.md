# Approximate Query Engine — Techniques Documentation

## Overview

This project implements an **Approximate Query Processing (AQP) Engine** that trades
a small amount of accuracy for **significant speed improvements** (3× to 10×+ faster)
when running analytical queries over large datasets.

---

## 1. HyperLogLog (HLL) — COUNT DISTINCT

### What is it?
HyperLogLog is a probabilistic algorithm that counts the number of **unique** (distinct)
elements in a dataset using very little memory.

### How does it work?
1. **Hash** each element to get a uniformly distributed binary string.
2. **Split** hashes into `2^p` buckets using the first `p` bits.
3. For each bucket, **track the longest run of leading zeros** seen.
4. Use the **harmonic mean** across all buckets to estimate total distinct count.

### Why does it work?
Intuitively: if you flip a fair coin, seeing 5 heads in a row is unlikely.
The more distinct elements you hash, the more likely you are to see long runs of zeros.
The longest run observed gives an estimate of `log₂(N)`.

### Space and Accuracy
- **Space:** O(2^p) registers × 5 bits each ≈ 2^p × 5 bits
- **Error:** approximately `1.04 / √(2^p)`
  - p=10: ~3.2% error, 640 bytes
  - p=14: ~0.8% error, 10 KB
  - p=16: ~0.4% error, 40 KB

### Implementation
We use the `datasketch` Python library's `HyperLogLog` class.
The accuracy slider (80%→99%) maps to precision bits (6→16).

---

## 2. Count-Min Sketch (CMS) — COUNT / Frequency

### What is it?
A Count-Min Sketch is a compact data structure that estimates how many times
each item appears in a stream. It **never underestimates**, but may slightly overestimate.

### How does it work?
1. Create a **2D array** with `d` rows (hash functions) × `w` columns.
2. To **add** an item: hash it with each row's function, increment those cells.
3. To **query** an item: hash it, take the **minimum** across all rows.

### Why minimum?
Hash collisions cause overestimates. By taking the minimum across independent
hash functions, we reduce the chance that *all* functions collide.

### Space and Accuracy
- **Space:** O(w × d) counters
- **Guarantee:** estimate ≤ true_count + ε × N with probability ≥ 1 - δ
  - w = ⌈e/ε⌉ (width from error tolerance)
  - d = ⌈ln(1/δ)⌉ (depth from failure probability)

### Implementation
**Custom Python implementation** using MD5 hashing with different seeds per row.

---

## 3. Reservoir Sampling — AVG, SUM, GROUP BY

### What is it?
Reservoir Sampling (Algorithm R by Jeffrey Vitter, 1985) maintains a **fixed-size
uniform random sample** from a data stream of unknown or very large size.

### How does it work?
1. **Fill** the reservoir with the first `k` items.
2. For each subsequent item at position `i` (where `i > k`):
   - Generate a random number `j` uniformly from [0, i).
   - If `j < k`, replace `reservoir[j]` with the new item.
3. After all items: the reservoir is a **uniform random sample** of size `k`.

### Why it's useful for AQP
- **AVG:** The sample mean is an **unbiased estimator** of the population mean.
- **SUM:** Estimated as `sample_mean × total_count`.
- **GROUP BY:** Split the sample by group, aggregate each group separately.

### Accuracy ↔ Sample Size
- Larger sample → lower variance → more accurate
- Accuracy slider maps: 80% → 2% sample, 99% → 30% sample

### Implementation
**Custom Python implementation** of Algorithm R with NumPy random number generation.

---

## 4. Trade-off Design

The accuracy slider (80%–99%) uniformly controls all techniques:

| Accuracy | HLL Precision | CMS Width | Reservoir % | Est. Speedup |
|----------|--------------|-----------|-------------|-------------|
| 80%      | 6 bits       | ~272      | 2%          | ~10×        |
| 85%      | 8 bits       | ~453      | 4%          | ~7×         |
| 90%      | 10 bits      | ~816      | 8%          | ~5×         |
| 95%      | 12 bits      | ~2719     | 15%         | ~3×         |
| 99%      | 16 bits      | ~27183    | 30%         | ~2×         |

---

## 5. Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend API | FastAPI | REST endpoints + WebSocket |
| Exact Engine | DuckDB | SQL queries on Parquet data |
| Data Processing | Pandas + NumPy | DataFrame operations |
| HLL | datasketch | COUNT DISTINCT estimation |
| CMS | Custom Python | Frequency estimation |
| Sampling | Custom Python | AVG/SUM/GROUP BY estimation |
| Frontend | React.js + Vite | UI framework |
| Charts | Recharts | Data visualization |
| Styling | Tailwind CSS v3 | Responsive design |
