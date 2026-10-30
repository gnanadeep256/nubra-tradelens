# TradeLens Data Contract and Rule Definitions

## Record Definition

One CSV row represents one completed round-trip trade. Raw order/fill rows are not interchangeable with completed trades: partial fills and partial exits need to be reconciled before upload. The prototype assumes that reconciliation has already occurred.

## Required Columns

| Column | Type | Validation / meaning |
|---|---|---|
| `trade_id` | string | Required and unique within the file. |
| `instrument` | string | Required display label, e.g. `NIFTY`, `BANKNIFTY`. Used for instrument comparability validation. |
| `entry_time` | ISO-like datetime | Required; must parse as a valid date/time. |
| `exit_time` | ISO-like datetime | Required; must be strictly later than entry time. |
| `position_size_inr` | number | Positive rupee notional for the completed position. |
| `gross_pnl_inr` | number | Trade-level P&L before recorded charges; may be negative or positive. |
| `charges_inr` | number | Recorded charges for the completed trade; must be zero or greater. |

Derived value:

`net_pnl_inr = gross_pnl_inr - charges_inr`

The application does not trust an uploaded `net_pnl_inr` column; it derives the value deterministically from gross P&L and charges.

## Summary Calculations

- **Completed trades** = count of valid normalised trade rows in the active reporting period.
- **Gross P&L** = sum of `gross_pnl_inr`.
- **Recorded charges** = sum of `charges_inr`.
- **Net P&L** = gross P&L − recorded charges.
- **Period filter** = users can review all records or segment by calendar month for multi-month datasets.

## Insight Rules & Financial-Impact Methodology

Insights are ranked by **Net Cohort Deficit** (`cohortDeficit`), defined as the net negative balance across all qualifying trades belonging to that behavioural cohort. If a cohort generated both profits and losses, the net cohort deficit reflects the actual net financial footprint of the habit, while individual losing-trade losses are preserved as secondary explanatory metrics.

### 1. Losing Trades Held Longer (`holding`)

- **Classification:** Winning trades have `net_pnl_inr > 0`; losing trades have `net_pnl_inr < 0`.
- **Sample guards:** Requires at least 5 winning and 5 losing trades in the period.
- **Baseline:** Calculate the median holding duration of winning trades.
- **Detection condition:** Flag losing trades whose duration is strictly greater than the winning-trade median.
- **Emission guard:** Emit only when at least 3 losing trades are flagged.
- **Financial impact:**
  - **Net cohort deficit:** Sum of absolute net losses across flagged losing trades (₹30,039 in demo).
  - **Explanatory losses:** ₹30,039 across 24 flagged losing trades.
- **Interpretation & limitation:** This is a duration comparison; it does not prove that holding longer caused the loss or that an earlier exit would definitely have prevented the deficit.

### 2. Trades Opened Shortly After a Loss (`after-loss`)

- **Chronological lookup:** For each trade, find the most recently exited prior trade(s) where `exit_time <= entry_time` using an optimised $O(N \log N)$ search.
- **Simultaneous exit handling:** If multiple trades share the identical maximum exit timestamp:
  - If all tied trades closed at a loss, it is treated as an unambiguous prior loss.
  - If tied trades had conflicting outcomes (one profit, one loss), the sequence is deemed ambiguous and excluded from triggering a post-loss flag.
- **Detection condition:** Flag the trade when the unambiguous prior trade closed at a net loss and the time gap is 0–10 minutes inclusive.
- **Sample guards:** Requires at least 5 qualifying trades in the cohort and at least 3 subsequent losing outcomes among them.
- **Financial impact:**
  - **Net cohort deficit:** Absolute net P&L across all qualifying trades if negative (`abs(cohortNet)` = ₹3,041 in demo). Used for ranking.
  - **Explanatory losses:** Sum of net losses among subsequent losing trades (₹14,804 across 12 trades in demo).
  - **Explanatory gains:** Sum of net profits among subsequent winning trades (+₹11,763 across 13 trades in demo).
- **Interpretation & limitation:** Timing does not prove emotional trading, revenge trading, or causation. Note that 13 of the 25 trades actually closed in profit.

### 3. Losses in Larger Positions (`large-size`)

- **Instrument comparability validation:**
  - Single-instrument datasets are inherently comparable.
  - Recognized Indian index derivatives family (`NIFTY`, `BANKNIFTY`, `FINNIFTY`, `MIDCPNIFTY`, `SENSEX`, `BANKEX`) share compatible notional scales and form an established comparable group.
  - If a dataset spans disparate mixed instruments (e.g. index options mixed with individual equities or commodities with >3x scale disparity), Rule C is **suppressed** and an explanatory notice is displayed.
- **Sample guards:** Requires at least 20 valid completed trades in comparable instruments.
- **Quartile threshold:** Calculate the 75th-percentile position notional using the nearest-rank method ($k = \lceil 0.75 \times N \rceil$).
- **Detection condition:** Benchmark all trades at or above that threshold (the top quartile).
- **Emission guard:** Requires at least 5 trades in the largest quartile (`MIN_GROUP >= 5`) and at least 3 losing outcomes among them.
- **Financial impact:**
  - **Net cohort deficit:** Absolute net P&L across all quartile trades if negative (`abs(cohortNet)` = ₹6,704 in demo). Used for ranking.
  - **Explanatory losses:** Sum of net losses among quartile losing trades (₹14,242 across 8 trades in demo).
  - **Explanatory gains:** Sum of net profits among quartile winning trades (+₹7,538 across 8 trades in demo).
- **Interpretation & limitation:** Larger positions naturally produce larger rupee swings in both directions. This does not establish that position sizing was inappropriate.

## Ranking Order in Demo Dataset

1. **Rank 1:** Losing trades held longer — Net cohort deficit: **₹30,039**
2. **Rank 2:** Losses in larger positions — Net cohort deficit: **₹6,704** (Losing trades: ₹14,242)
3. **Rank 3:** Trades opened shortly after a loss — Net cohort deficit: **₹3,041** (Losing trades: ₹14,804)

## Money Language and Guardrails

- The primary figure is labeled **“Net cohort deficit”**.
- Supporting trade losses are labeled **“Losses in losing trades”**.
- The app strictly avoids terms like “avoidable losses”, “money wasted”, or “guaranteed savings”.
- Insights can overlap; their rupee amounts must never be added together.
