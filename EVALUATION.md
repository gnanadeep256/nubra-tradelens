# Artifact 03 — TradeLens Evaluation Plan and Results

## Ship Bar Decided Before Testing

1. 100% of mathematical correctness tests pass against independent verification scripts.
2. Ranking strictly reflects net cohort deficit (`cohortDeficit`) rather than one-sided gross losses.
3. Unsupported behavioural findings are never invented when data is clean, insufficient, or contains disparate incomparable instruments.
4. Zero misleading financial-impact claims; no screen claims causation, avoidable losses, or guaranteed savings.
5. Every displayed insight exposes its full qualifying trade cohort, calculation rule, and interpretation caveat.
6. Complete main user journey works end-to-end without login, persists commitments locally, and restores them on revisit.
7. Stepper navigation remains strictly synchronised with actual review and insight state.
8. At least 4/5 comprehension checks pass when real users are tested (manual pre-deployment check).

---

## Evaluation Results Table (Automated Test Suites)

Executed via `node test_app.cjs`, `python audit_metrics.py`, and `node eval_scenarios.cjs`.

| Test ID | Test Type | Input or Scenario | Expected Result | Actual Result | Pass / Fail | Fix Applied, if Any |
|:---|:---|:---|:---|:---|:---:|:---|
| **TC-01** | Correctness | Built-in 60-trade synthetic dataset | 60 completed trades; gross P&L −₹12,050; charges ₹2,700; net P&L −₹14,750 | Summary KPI grid displayed all 4 exact values | **PASS** | None (baseline verified) |
| **TC-02** | Correctness & Ranking | Holding duration (Rule A), Large positions (Rule C), Post-loss entry (Rule B) | Rule A: ₹30,039 (24 trades); Rule C: ₹6,704 net deficit (16 trades: ₹14,242 losses, +₹7,538 wins); Rule B: ₹3,041 net deficit (25 trades: ₹14,804 losses, +₹11,763 wins). Ranking: A > C > B | Displayed exact cohort deficits and ranked A (₹30,039) > C (₹6,704) > B (₹3,041) | **PASS** | Implemented cohort net deficit ranking with explanatory losses |
| **TC-03** | Persistence | Browser revisit with saved `localStorage` commitment | App retrieves and renders "Active recorded commitment" banner with title, commitment, and timestamp | Active commitment banner displayed; pill badge visible in header | **PASS** | Added `loadSavedCommitment()` and `renderActiveCommitmentBox()` |
| **TC-04** | Comparability | Mixed disparate instruments (NIFTY + RELIANCE with 50x notional disparity) | Rule C suppressed; banner explains position sizes cannot be benchmarked across disparate scales | Rule C suppressed; notice displayed citing 50.0x scale disparity | **PASS** | Added `checkInstrumentComparability()` guard |
| **TC-05** | Deterministic Logic | Simultaneous exit with conflicting outcomes at identical minute (-₹1,000 & +₹1,200 at 09:30) | Exclude ambiguous sequence from post-loss trigger; subsequent trade at 09:35 not flagged | Ambiguous simultaneous exit excluded; subsequent trade not flagged | **PASS** | Implemented tie resolution excluding conflicting simultaneous exits |
| **TC-06** | Core Feature | Multi-month CSV with 3 calendar months (Aug, Sep, Oct 2026; 45 trades total) | Period dropdown dynamically populates calendar months; selecting month segments trades and recalculates KPIs | Filtered Aug (15 trades, ₹7,050), Sep (15 trades), and Oct (15 trades) with exact KPI updates | **PASS** | Added period selector dropdown and `applyPeriodFilter()` |
| **TC-07** | Evidence Consistency | Evidence modal for Rules A, B, and C on demo dataset | Table row counts strictly match displayed statistics: Rule A (24 rows), Rule C (16 rows), Rule B (25 rows) | All modal table row counts matched displayed cohort statistics 100% | **PASS** | Passed full qualifying cohort (wins + losses) to modal table for Rule C |
| **TC-08** | Accessibility | Pressing `Escape` key while evidence modal is open | Evidence modal closes; background scroll unlocked; focus restored to triggering button | Modal closed cleanly on `Escape`; event listener removed | **PASS** | Added `handleModalKeydown()` with `Escape` listener and focus trapping |
| **TC-09** | Navigation State | Initial boot vs post-generation stepper states | Step 1 enabled; Step 2 and Step 3 strictly disabled until insights are generated | Navigation stepper accurately enforced sequential progression | **PASS** | Corrected boolean disabled logic in `setView()` |
| **TC-10** | User Journey | User dismisses all 3 insights via modal feedback | Displays dismissal-specific empty state with "Restore dismissed insights" button; click restores findings | Empty state acknowledged user dismissal; restore button restored all 3 insights | **PASS** | Differentiated user dismissal from insufficient data empty state |
| **TC-11** | Scalability | Large CSV containing 1,000 completed round-trip trades | Parsing, validation, and insight generation complete in <500ms without thread lockup | Processed in 48ms (parse: 12ms, generation: 36ms); summary showed 1,000 trades | **PASS** | Optimised Rule B lookup from $O(N^2 \log N)$ to $O(N \log N)$ with binary search |
| **TC-12** | Boundary State | Dataset with 20 trades, all losses (0 wins) | Rule A suppressed (requires $\ge 5$ winning baseline trades); zero NaN values or runtime crashes | Rule A suppressed cleanly; zero crashes or division-by-zero errors | **PASS** | Sample size guards enforced (`MIN_GROUP >= 5`) |
| **TC-13** | Boundary State | Dataset with 20 trades, all wins (0 losses) | All costly habit rules suppressed; zero false positives | Rendered "No supported costly habits found"; zero findings emitted | **PASS** | False-positive suppression validated |
| **TC-14** | Input Validation | Missing or empty `charges_inr` field in CSV row | File rejected with specific error: `Row X: charges_inr is missing.` | Inline `#errorBox` displayed expected row error message | **PASS** | Enforced strict CSV row schema validation |
| **TC-15** | Input Validation | Duplicate `trade_id`, negative charges, header-only CSV, invalid datetime | Reject each invalid CSV with clear, specific validation messages | All 4 invalid inputs rejected with specific actionable error messages | **PASS** | Added specific field and data-type validation checks |
| **TC-16** | End-to-End Flow | Full journey without login: Overview -> Insights -> Modal -> Experiment -> Save | Seamless transition across all 3 steps; commitment saved in `localStorage` | Complete journey executed start-to-finish without errors or authentication | **PASS** | Preserved zero-dependency, client-only architecture |

---

## Before-Versus-After Financial Calculations Summary

| Metric / Behavioural Rule | Before Fix | After Fix | Methodological Justification |
|:---|:---|:---|:---|
| **Rule A (Holding Losers)** | Displayed: **₹30,039** (24 trades) | Net Cohort Deficit: **₹30,039** (24 trades) | All flagged trades are losses; cohort deficit equals sum of losses. |
| **Rule B (Trades After Loss)** | Displayed: **₹14,804** (Rank 2)<br>*(Gross losses of 12 losing trades)* | Net Cohort Deficit: **₹3,041** (Rank 3)<br>*(12 losses of ₹14,804 offset by 13 wins of +₹11,763)* | Avoids deceptive claim that quick re-entry cost ₹14,804 when net drag across the 25 trades was only ₹3,041 (52% win rate). Explanatory losses (₹14,804) preserved in secondary metrics. |
| **Rule C (Large Positions)** | Displayed: **₹14,242** (Rank 3)<br>*(Gross losses of 8 losing trades)* | Net Cohort Deficit: **₹6,704** (Rank 2)<br>*(8 losses of ₹14,242 offset by 8 wins of +₹7,538)* | Accurately captures net drag of top quartile (₹6,704) while preserving individual losing-trade losses (₹14,242) as explanatory context. |
| **Ranking Order** | Rule A > Rule B > Rule C | **Rule A (₹30,039) > Rule C (₹6,704) > Rule B (₹3,041)** | Ranks findings by true net financial impact on the trader's account. |
| **Rule C Evidence Rows** | 8 rows (losses only) | **16 rows** (8 losses + 8 wins) | Resolves discrepancy where stat cited 16 trades but table showed 8. |
| **Instrument Comparability** | Blind comparison across all instruments | **Validated comparable groups** (index family / single instrument) | Suppresses Rule C when disparate instruments (e.g. NIFTY + RELIANCE) are present. |

---

## Test Execution Classification

### 1. Automated Tests (Executed & Verified)
- **Node.js Automated Test Suite (`test_app.cjs`):** 9 test blocks, 34 assertions covering DOM state transitions, persistence, cohort calculations, simultaneous exits, period filters, and edge cases. **100% Passed.**
- **Python Mathematical Verification (`audit_metrics.py`):** Independent recalculation of all KPIs, medians, quartiles, and ranking. **100% Passed.**
- **Extended Evaluation Harness (`eval_scenarios.cjs`):** 10 specific evaluative scenarios covering mixed instruments, 1,000-record scale test, boundary conditions (all wins, all losses), and tie-breaking. **100% Passed.**

### 2. Manual Pre-Submission Checks (Required Prior to Final Deployment)
The following manual checks cannot be replaced by automated unit tests and must be completed in a real browser environment prior to public sharing:
- **Visual Inspection across Viewports:** Open `index.html` directly in Chrome and Edge desktop at 1440px and mobile emulation at 375px (iPhone SE) and 390px (iPhone 14) to inspect font scaling and spacing.
- **Physical File Picker Interaction:** Click **Upload trade CSV** in the OS file dialogue, select `sample_trades.csv`, and verify DOM update.
- **Human Comprehension Test (4/5 Bar):** Present the 3 insight cards and caveats to 2 non-traders and 3 active retail traders. Verify whether they correctly understand that:
  1. Rupee amounts represent net cohort deficits, not guaranteed recoverable cash.
  2. Overlapping insights must not be summed together.
  *Status:* Not yet measured with human subjects; required before production release.
- **Incognito Browser Cache Check:** Load the deployed static URL in a fresh incognito window to verify zero dependency leaks or asset 404s.

---

## Outstanding Issues & Deployment Blockers

### Deployment Blockers for Public Release
1. **Human Comprehension Verification (Candidate Guide Requirement):** The candidate guide specifies testing with real users to ensure 4/5 comprehension of non-judgmental caveats and financial impact. This must be recorded with actual participants before public rollout.
2. **Public Hosting Verification:** The application is currently verified locally. It must be hosted on GitHub Pages or Netlify and tested over HTTPS before final assignment submission.

### Non-Blocking Backlog Items
1. **Raw Broker Export Normalisation:** Traders whose brokers export raw execution fills (multiple partial fills per trade) currently need to pre-aggregate rows before CSV upload.
2. **Sub-Minute Execution Order:** Where multiple distinct orders occur within the identical minute, order depends on row order in the CSV because seconds/tick IDs are not captured in the schema.
