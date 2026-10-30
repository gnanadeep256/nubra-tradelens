# Nubra TradeLens — Prototype

**Problem selected:** Problem 03 — Post-trade review.

TradeLens is a take-home product concept for Nubra that turns completed trade history into up to three deterministic, evidence-backed behavioural observations. It is a static, zero-dependency HTML/CSS/JavaScript application with a 60-trade synthetic dataset embedded directly in `index.html`.

## Run locally

1. Extract the project folder.
2. Open `index.html` in any evergreen desktop or mobile browser. The demo dataset is preloaded, so no build step, server, or login is required.
3. Review your Monthly Summary KPIs and optionally segment by reporting month.
4. Click **Find my costly habits**.
5. Inspect supporting trade records, calculations, and caveats for each finding.
6. Choose one active habit to monitor and save your commitment. Returning users will see their previously saved commitment restored automatically.

The app has no external libraries or trackers and connects to no external servers or brokerage accounts.

## Project Structure

- `index.html` — complete single-file application with embedded CSS, accessible UI, and synthetic demo data.
- `sample_trades.csv` — downloadable/importable 60-row synthetic completed-trade dataset.
- `sample_trades.json` — identical JSON representation of the 60 trades.
- `generate_data.py` — deterministic synthetic dataset generator.
- `audit_metrics.py` — standalone Python audit script independently computing all KPIs and rule metrics.
- `test_app.cjs` — comprehensive Node.js interaction, edge-case, and validation test suite.
- `DATA_DICTIONARY.md` — exact data contract, rule specifications, and financial-impact definitions.
- `EVALUATION.md` — test matrix, expected vs actual results, and ship bar criteria.
- `PROMPT_LOG.md` — prompt and iteration history disclosure.

## Supported CSV Schema

The CSV must contain these columns:

`trade_id,instrument,entry_time,exit_time,position_size_inr,gross_pnl_inr,charges_inr`

Each row represents one unique, fully completed round-trip trade. Partial fills and partial exits must be reconciled into completed round-trips prior to upload. Timestamps must be valid ISO-8601 strings (e.g. `2026-10-01T09:15`). Position sizes must be strictly positive; charges must be non-negative. Net P&L is derived as gross P&L minus recorded charges.

## Financial-Impact Methodology & Ranking

1. **Ranking by Net Cohort Deficit:** Insights are ranked by the net negative deficit of the complete qualifying cohort (`cohortDeficit`), acknowledging both profitable and losing trades in the group.
2. **Explanatory Losses:** Gross losses among losing trades in the cohort are displayed alongside the net deficit so traders understand both the downside and the offsetting gains.
3. **Demo Dataset Ranking:**
   - **Rank 1:** Losing trades held longer (Rule A) — Net deficit: **₹30,039** (24 flagged losing trades)
   - **Rank 2:** Losses in larger positions (Rule C) — Net deficit: **₹6,704** (16 trades in quartile: ₹14,242 losses in 8 losing trades, +₹7,538 gains in 8 winning trades)
   - **Rank 3:** Trades opened shortly after a loss (Rule B) — Net deficit: **₹3,041** (25 trades in cohort: ₹14,804 losses in 12 losing trades, +₹11,763 gains in 13 winning trades)

## Key Enhancements in Current Build

- **Compact Native Data Visualisations:** Dynamic, dependency-free CSS visualizations inside the evidence modal:
  - *Rule A:* Duration comparison bar chart showing winning vs losing median holds in minutes.
  - *Rule B:* Cohort composition stacked bar with separate win/loss outcome cards, proving the cohort contains both winners and losers.
  - *Rule C:* Top-quartile outcome breakdown showing wins, losses, and net quartile deficit.
- **Refined Fintech Visual Hierarchy:** Clean slate-navy palette, disciplined typography scale, distinct primary/secondary action styling, and WCAG AA accessible contrast.
- **Cohort Net Deficit Methodology:** Ranks habits based on net deficit rather than one-sided gross losses.
- **Instrument Comparability Validation:** Rule C benchmarks position sizes only across comparable instruments (e.g. recognized index derivatives) and suppresses the rule with an explanatory notice if mixed disparate instruments are uploaded.
- **Deterministic Simultaneous Exit Handling:** Resolves ambiguous sequences in Rule B where multiple legs closed at the identical minute with conflicting outcomes.
- **Commitment Persistence:** Loads and renders previously saved commitments from `localStorage` on revisit, with an option to update or replace them.
- **Multi-Month Period Filtering:** Allows users uploading multi-month tradebooks to segment reviews by calendar month.
- **Modal Accessibility & Focus Management:** Added `Escape`-key dismissal, focus trapping, and focus restoration to the evidence modal.
- **Dynamic Habit Selection:** Step 3 only surfaces reflection habits corresponding to currently active, non-dismissed insights.

## Important Limitations

- Built-in trade records are synthetic and do not represent actual Nubra customer data.
- TradeLens is a retrospective educational review prototype, not an official investment advisory system or trade-execution engine.
- Detected habits are heuristic review prompts, not statistical proof of causation or bad trading decisions.
- Do not add insight amounts together; overlapping trades can trigger more than one rule.
