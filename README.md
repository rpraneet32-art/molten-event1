# Approximate Query Engine
A high-performance full-stack web application designed to demonstrate the power of **Approximate Query Processing (AQP)** for large-scale analytical insights.

Built for the **Google Developer Groups WT' 26 Problem Statement 1**.

## 🚀 The Solution
Traditional databases scanning terabytes of raw data (like clickstreams or logs) are extremely slow because they guarantee 100% exact answers. However, business users usually only need *trends* or *approximate* metrics (e.g., getting a 99% accurate answer in 0.1 seconds rather than a 100% accurate answer in 10 minutes).

This project implements:
- **DuckDB** for providing exact "ground truth" execution baselines.
- **Probabilistic Data Structures** (HyperLogLog, Count-Min Sketch) and custom **Reservoir Sampling** for lightning-fast approximate query estimations.
- A **React + Vite** frontend with a beautiful **dark-theme glassmorphism UI**.

### ✅ Deliverables Completed
1. Working query engine prototype (Standalone FastAPI application).
2. Support for SQL-like analytical queries (`COUNT`, `SUM`, `AVG`, `GROUP BY`).
3. Benchmarks visualization showing speed vs. accuracy trade-offs.
4. Comprehensive documentation explaining chosen techniques.

### 🌟 Brownie Points Completed
1. **Real-time analytics**: A live-updating streaming dashboard.
2. **Configurable trade-off slider**: Dial in your preferred accuracy (80% - 99%).
3. **Comparison UI**: Exact vs Approximate results displayed side-by-side with metrics.

---

## 🛠️ Tech Stack
- **Backend**: Python, FastAPI, NumPy, Pandas, DuckDB, `datasketch`
- **Frontend**: React.js, Vite, Tailwind CSS v3, Recharts
- **Techniques**: Reservoir Sampling (Algorithm R), HyperLogLog, Count-Min Sketch

---

## 📖 Beginner-Friendly Workflow (How to run this project)

Follow these easy steps to get the engine running on your machine:

### 1. Prerequisites
Ensure you have the following installed on your system:
- **Python 3.10+**
- **Node.js (npm)**

### 2. Setup the Backend (Terminal 1)
The backend powers the queries, handles mathematical models, and serves data through APIs and WebSockets.

```bash
# Navigate to the backend directory
cd backend

# Create a clean Python Virtual Environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On MacOS/Linux:
source venv/bin/activate

# Install all the necessary dependencies
pip install -r requirements.txt

# Start the FastApi Server
uvicorn main:app --reload --port 8000
```
*(The first time you start the backend, it will automatically generate a highly realistic 1.2M row synthetic e-commerce dataset for testing!)*

### 3. Setup the Frontend (Terminal 2)
The frontend uses React and Tailwind CSS to display an interactive modern UI.

```bash
# Open a new terminal instance and navigate to the frontend directory
cd frontend

# Install the necessary npm packages
npm install

# Start the React / Vite development server
npm run dev
```

### 4. Open the App!
Navigate to `http://localhost:5173` in your browser. You can now:
1. Try out SQL queries in the **Query Engine** tab.
2. View speedup charts in the **Benchmarks** tab.
3. Watch live running aggregations in the **Live Stream** tab.
4. Read the technical implementation details in the **Docs** tab.
