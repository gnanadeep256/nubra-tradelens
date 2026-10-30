# Artifact 02 — Nubra TradeLens Complete Prompt and Build Log

**Product Name:** Nubra TradeLens  
**Problem Selected:** Problem 03 — Post-Trade Review  
**Author / Candidate:** Product Manager Candidate  
**Platform / Scope:** Nubra (Zanskar Technologies)  
**Technology Stack:** Static Single-Page Application (HTML5, Vanilla CSS3, Vanilla ES6+ JavaScript, Zero External Runtime Dependencies)  
**Version:** 1.2.0 (Post-Audit Evaluated & Visually Polished Build)  
**Last Updated:** October 30, 2026  

---

## 1. Project Context and Objective

Nubra TradeLens is a post-trade behavioural review tool designed for active retail Futures & Options (F&O) traders in India. The application takes a trader's recent trade history (specifically completed round-trip trade records, not unprocessed broker order-execution lines or partial fills), identifies up to three costly behavioural patterns, shows their net financial impact in rupees, presents inspectable trade-level evidence, and guides the trader to choose one specific behavioural commitment for the following month.

### Assignment Challenge: Problem 03 — Post-Trade Review
> *"Most retail traders never review their own trades. Turn a month of order history into the two or three habits that are costing them money."*

Nubra explicitly evaluated whether candidates could translate completed trade data into a small, understandable, evidence-backed tool rather than an over-engineered analytics dashboard. Candidates were instructed to provide the actual prompts and iterations used to build the application, including unsuccessful attempts and failures.

This document provides a chronological record of available verbatim prompts, excerpts, reconstructed summaries, and failures showing how Nubra TradeLens evolved from its initial concept and baseline implementation to its evaluated and polished state. As disclosed throughout, certain earlier steps are documented via excerpts or reconstructed briefs rather than full transcripts.

---

## 2. Original Problem Statement and Target User

### 2.1 Target User Persona
- **Who they are:** An active retail F&O trader who executes multiple index options and futures trades each month (primarily on NIFTY, BANKNIFTY, FINNIFTY, and SENSEX).
- **Who they are not:** A complete beginner seeking an introductory F&O options tutorial, or an institutional quantitative fund requiring algorithmic backtesting.
- **Their reality:** They already have completed trade records, P&L statements, and contract notes from their broker. However, reviewing hundreds of order lines and contract notes manually is tedious, exhausting, and emotionally charged. Patterns remain invisible in raw spreadsheets. Importantly, TradeLens is designed around completed round-trip trades rather than raw order executions: partial fills and multi-leg orders must be reconciled into completed round-trip records prior to review.

### 2.2 Final Problem Statement
> *"Active retail F&O traders struggle to identify recurring trading behaviours associated with their losses because reviewing a long history of orders and P&L records manually is tedious and makes patterns difficult to spot. This matters because potentially costly behaviours may go unnoticed and repeat, limiting the trader's ability to learn from past decisions."*

### 2.3 The Three Core Questions TradeLens Answers
1. **What recurring trading patterns can be identified in my recent tradebook?**  
   Identifies up to three deterministic behavioural habits:
   - *Rule A (Holding Losers):* Evaluates flagged losing trades whose hold duration exceeded the median hold of winning trades.
   - *Rule B (Trades Opened Shortly After Loss):* Evaluates the complete qualifying cohort of trades opened within 10 minutes of a losing trade.
   - *Rule C (Large Positions):* Evaluates the complete qualifying cohort of trades in the top notional quartile (>= Q75).
2. **Which of these patterns had the largest financial impact on my account?**  
   Ranks habits using a prioritisation heuristic based on each rule's cohort-level financial result: observed net cohort deficit for Rules B and C (accounting for both gains and losses in the qualifying group), and sum of flagged losses for Rule A (where by definition all flagged trades are losses). This ranking is an educational prioritisation heuristic to direct trader attention, not a like-for-like causal comparison, because Rule A isolates flagged losing trades while Rules B and C evaluate the net performance of their full qualifying cohorts.
3. **What is one simple habit I can commit to monitoring next month?**  
   Provides a structured commitment mechanism with local persistence across browser sessions.

---

## 3. Product Scope and Build Principles

1. **Zero Third-Party App Builders:**  
   The application was hand-crafted using standard web technologies with AI coding assistance. No closed-box third-party app builders (such as Lovable, Bolt, v0, or Replit Agent) were used. The prompt log therefore reflects direct AI IDE engineering interactions rather than proprietary builder chat exports.
2. **Zero External Runtime Dependencies:**  
   To guarantee high reliability, fast page loading, and privacy-first local operation, TradeLens uses zero external runtime dependencies. No external chart libraries (Chart.js, D3.js), no frameworks (React, Vue), and no external CSS utilities (Tailwind, Bootstrap). All visualisations and data tables are implemented using native semantic HTML and CSS.
3. **Privacy-First & Client-Side Processing:**  
   Financial tradebook data is highly sensitive. TradeLens executes all CSV parsing, metrics derivation, and habit detection directly in client-side browser memory. Zero trade data is transmitted to external servers or cloud APIs.
4. **Non-Judgmental Tone & Causation Disclaimer:**  
   Retail trading is fraught with psychological shame. The interface strictly avoids condescending labels ("bad trader", "stupid mistake", "revenge trading") and instead uses neutral, objective terminology ("trades opened within 10 minutes of a loss", "observed net cohort deficit"). It explicitly disclaims causation: behavioural habits are reflection prompts, not guaranteed proof of avoidable losses.
5. **Inspectable Evidence Over Black-Box Scores:**  
   Traders distrust opaque "behavioural scores". Every finding in TradeLens exposes its exact calculation rule, baseline comparison, qualifying sample count, and full interactive table of supporting trade records.
6. **No Live Execution Scope:**  
   TradeLens is strictly a retrospective learning tool. Real-time order execution, automated stop-losses, and broker API trade placements were deliberately excluded to focus entirely on post-trade reflection.

---

## 4. Development Timeline

The application evolved across seven distinct iterations:

| Iteration | Phase | Primary Focus | Key Inputs & Artifacts | Primary Outcome |
|:---:|:---|:---|:---|:---|
| **Iteration 0** | Baseline Concept & Prototype | Core problem definition, CSV schema, and initial single-page HTML layout. | Nubra Problem 03 prompt; initial 60-trade synthetic dataset generator (`generate_data.py`). | Working prototype with preloaded synthetic data, basic KPIs, and preliminary habit detection. |
| **Iteration 1** | Codebase & Product Audit | Deep inspection of product alignment, calculation logic, edge cases, and accessibility. | 17,000-character comprehensive audit prompt in AI IDE (`Prompt 0`). | Discovery of critical product/algorithm gaps (gross loss ranking distortion, instrument comparability, missing persistence). |
| **Iteration 2** | Synthetic Dataset Testing | Stress-testing detection rules against custom positive, negative, and edge scenarios. | 3 external synthetic datasets: `01_clear_pattern_demo.csv`, `02_clean_control.csv`, `03_edge_mixed_instruments_and_ties.csv`. | User confirmed detection on clear patterns, verified zero false positives on clean control, and noted edge vulnerabilities. |
| **Iteration 3** | Post-Audit Improvements | Complete algorithmic, financial methodology, and UX overhaul. | 3-Round improvement prompt in AI IDE (`Prompt 1`). | Implemented net cohort deficit ranking, Rule C comparability guard, $O(N \log N)$ Rule B search, simultaneous exit handling, `localStorage` persistence, and period filters. |
| **Iteration 4** | Testing with Evals | Rigorous evaluation against Step 7 ship bar. | Evaluation prompt (`Prompt 2`); `test_app.cjs`, `audit_metrics.py`, `eval_scenarios.cjs`. | 34 automated unit assertions passed (100%); 10 programmatic eval scenarios passed (100%); documented manual testing requirements. |
| **Iteration 5** | Visual Polish & Visualisations | Elevating UI to a professional fintech standard without external libraries. | UI polish prompt (`Prompt 4`); custom CSS bar charts and cohort split cards. | Refined slate-navy palette; added native duration comparison bars (Rule A) and win/loss outcome split cards (Rules B & C). |
| **Iteration 6** | Final Verification & Prompt History | End-to-end regression testing and final documentation review. | Comprehensive test runner, Python audit, and evaluation matrix finalisation. | Zero regressions; 100% mathematical accuracy confirmed on automated suites; ship bar automated criteria passed; manual blockers documented. |

---

## 5. Detailed Chronological Prompt History

The following subsections record the actual prompts used during development, their objectives, execution outcomes, failures encountered, and follow-up corrections. Each entry explicitly notes whether it represents a **Complete Verbatim Prompt**, a **Verbatim Prompt Excerpt**, or a **Reconstructed Summary**.

---

### Iteration 0: Initial Product Concept and Baseline Build

- **Prompt ID:** Iteration 0 / Baseline
- **Context:** Project initiation outside the AI IDE session.
- **Objective:** Establish the foundational single-page prototype meeting Problem 03 requirements: preloaded synthetic data, 4 summary KPIs, 3 behavioural rules, evidence drawer, and next-month habit commitment.
- **Prompt Classification:** **Reconstructed Summary** *(Baseline application files were established prior to initiating the interactive AI IDE audit session; no external AI builder chat transcript exists).*
- **Reconstructed Prompt Brief:**
  > "Build a responsive, single-page web application called Nubra TradeLens for Problem 03 — Post-trade review. Load a reproducible synthetic dataset of 60 completed trades by default and support CSV upload. Show a monthly summary of completed trades, gross P&L, recorded charges, and net P&L. Implement three deterministic rules: (1) losing trades whose holding duration exceeds the median duration of profitable trades; (2) trades entered within 10 minutes after the nearest previously completed losing trade; and (3) losing trades in the largest quartile of position notional. Display no more than three findings, ranked by monetary impact. Every insight must show its calculation rule, sample size, supporting trades, and a plain-language limitation. Let the user inspect evidence, provide feedback, select one behaviour to monitor, and save a local commitment. Keep the app dependency-free, responsive, and usable without login."
- **Outcome:** A functioning single-page HTML/CSS/JS application (`index.html`) with an embedded 60-trade dataset, summary cards, insight cards, evidence modal, and commitment selection.
- **Identified Baseline Limitations:**
  - Ranked findings by gross losses alone, ignoring profitable trades within behavioural cohorts B and C.
  - Compared raw position sizes across incomparable instruments (e.g. NIFTY options vs equity shares).
  - Saved commitment was lost upon browser reload.
  - Stepper navigation allowed clicking ahead to Step 2 and Step 3 before review generation.
  - Rule B used quadratic $O(N^2 \log N)$ repeated array filtering.

---

### Iteration 1: Initial Codebase and Product Audit

- **Prompt ID:** Iteration 1 / Prompt 0 (Step 0)
- **Timestamp:** 2026-10-30T06:23:11Z (11:53:11 local)
- **Objective:** Perform a rigorous, multi-dimensional product and code audit evaluating whether TradeLens truly solved Problem 03 before modifying code.
- **Prompt Classification:** **Verbatim Prompt Excerpt** *(1,280 characters excerpted from the full 17,145-character comprehensive audit prompt).*
- **Verbatim Excerpt:**
  > `# Nubra TradeLens — Complete Product Context and Existing Codebase Audit`  
  > `I am working on a Product Manager take-home assignment for Nubra, an Indian trading and brokerage platform operated by Zanskar.`  
  > `The selected challenge is: Problem 03 — Post-Trade Review`  
  > `Before inspecting the code, understand the original assignment, the candidate reference guide, and the product decisions documented below. Your audit must evaluate the existing application against this product objective, not merely review its code quality.`  
  > `...`  
  > `Inspect the codebase against:`  
  > `1. Product understanding & user fit.`  
  > `2. Application architecture (static, zero-dependency, single-file).`  
  > `3. Behavioural detection algorithms (Rule A, Rule B, Rule C).`  
  > `4. Financial calculations (gross, charges, net, ranking).`  
  > `5. CSV parsing, validation, and error handling.`  
  > `6. User interactions and navigation guards.`  
  > `7. Responsive design and accessibility.`  
  > `8. Existing tests and verification scripts.`  
  > `9. Documentation consistency across README, DATA_DICTIONARY, and EVALUATION.`
- **Outcome:** The audit uncovered significant methodological and technical gaps:
  1. *Ranking Flaw:* In Rule B, quick re-entry trades had 13 wins (+₹11,763) and 12 losses (-₹14,804). Ranking by gross losses (₹14,804) claimed the habit was twice as destructive as it actually was (net cohort deficit was only ₹3,041).
  2. *Instrument Comparability:* Rule C compared notional size across all rows without checking if contracts belonged to the same scale family.
  3. *Persistence Leak:* LocalStorage commitment was saved but never retrieved or rendered when the page reloaded.
  4. *Navigation Desynchronisation:* Stepper permitted skipping review generation.
  5. *Performance Inefficiency:* Rule B performed repeated $O(N)$ filtering and sorting inside a loop ($O(N^2 \log N)$).
- **Files Inspected:** `index.html`, `sample_trades.csv`, `sample_trades.json`, `generate_data.py`, `audit_metrics.py`, `test_app.cjs`.
- **Validation Performed:** Verified baseline calculations via `audit_metrics.py` (Gross: -₹12,050, Charges: ₹2,700, Net: -₹14,750).

---

### Iteration 2: Synthetic Dataset Testing (External User Testing)

- **Prompt ID:** Iteration 2 / User Dataset Testing
- **Context:** Conducted by user to stress-test detection rules against controlled edge cases.
- **Objective:** Validate detection behavior on constructed edge-case tradebooks prior to code refactoring.
- **Prompt Classification:** **Reconstructed Summary** *(User performed manual browser uploads using custom synthetic testing datasets; files were not committed to the primary codebase).*
- **Datasets Tested:**
  1. `01_clear_pattern_demo.csv`: Deliberately injected extreme holding times, rapid re-entries, and massive position outliers. Confirmed all 3 rules triggered with expected rankings.
  2. `02_clean_control.csv`: Uniform holding times, disciplined re-entries (>60 mins), and uniform position sizing. Confirmed zero costly habits triggered and clean empty state was rendered.
  3. `03_edge_mixed_instruments_and_ties.csv`: Injected mixed equity/options rows and simultaneous exit timestamps. Confirmed the need for comparability guards and tie-breaking logic.
- **Outcome:** Proved that while the core detection algorithms worked under ideal conditions, they were vulnerable to mixed-instrument distortion and simultaneous execution ties.

---

### Iteration 3: Post-Audit Product and Technical Improvements

- **Prompt ID:** Iteration 3 / Prompt 1 (Step 58)
- **Timestamp:** 2026-10-30T06:55:05Z (12:25:05 local)
- **Objective:** Implement comprehensive fixes addressing all audit findings across financial methodology, comparability, persistence, performance, and accessibility.
- **Prompt Classification:** **Complete Verbatim Prompt** *(3,974 characters, unabridged).*
- **Verbatim Text:**
  > `We have completed the initial audit of Nubra TradeLens.`  
  > `Now implement a focused improvement round based on the audit findings.`  
  > `IMPORTANT:`  
  > `Preserve the existing static HTML/CSS/JavaScript architecture. Do not migrate to React, introduce a backend, or rewrite the application from scratch.`  
  > `ROUND 1 — CRITICAL PRODUCT AND FUNCTIONALITY FIXES`  
  > `1. Financial-impact methodology:`  
  > `- For Rule B, distinguish losing-trade losses from the net P&L of the complete qualifying cohort.`  
  > `- For Rule C, distinguish losses among large-position losing trades from the net P&L of all qualifying large-position trades.`  
  > `- Use the full cohort's net deficit for ranking where the behavioural rule includes both winning and losing trades.`  
  > `- Retain the individual loss amounts as separate explanatory metrics.`  
  > `- Explicitly label observed losses and avoid claiming causation or avoidable savings.`  
  > `- Preserve Rule A's documented methodology unless an independently justified correction is required.`  
  > `2. Rule C comparability:`  
  > `- Do not blindly compare position_size_inr across incomparable instruments.`  
  > `- Use the existing instrument information to establish comparable groups.`  
  > `- Where comparability cannot be established, suppress the insight and explain why.`  
  > `- Update documentation accordingly.`  
  > `3. Commitment persistence:`  
  > `- Retrieve the saved commitment from localStorage on application initialisation.`  
  > `- Display the previous commitment when the user returns.`  
  > `- Provide an appropriate update or replace option.`  
  > `4. Stepper navigation:`  
  > `- Prevent access to Insights before review generation.`  
  > `- Prevent access to the experiment before eligible insights exist.`  
  > `- Keep navigation state consistent with the actual application state.`  
  > `ROUND 2 — ALGORITHM AND USER EXPERIENCE`  
  > `5. Optimise Rule B's prior-trade lookup to avoid quadratic repeated filtering and sorting.`  
  > `6. Define deterministic handling of simultaneous exit timestamps. Exclude ambiguous sequences if the data does not establish reliable chronology.`  
  > `7. Ensure experiment choices correspond to currently available, non-dismissed insights.`  
  > `8. Fix the evidence modal so its supporting records and displayed sample counts are consistent.`  
  > `9. Differentiate the empty state caused by insufficient data from the state caused by manually dismissing all insights.`  
  > `10. Add Escape-key modal dismissal, focus management and focus restoration.`  
  > `11. Improve small-text contrast and add accessible labels to table headings and step navigation.`  
  > `12. Add a reporting-period filter for multi-month CSV uploads, retaining the default 30-day review.`  
  > `ROUND 3 — DOCUMENTATION AND VALIDATION`  
  > `13. Fix timestamp preservation in CSV export.`  
  > `14. Update test_app.cjs and audit_metrics.py to reflect corrected calculations.`  
  > `15. Update DATA_DICTIONARY.md, EVALUATION.md and README.md.`  
  > `16. Verify all changes pass tests before concluding.`
- **Outcome:** Successfully implemented all 16 items in `index.html`, `test_app.cjs`, `audit_metrics.py`, `DATA_DICTIONARY.md`, and `README.md`.
- **Key Methodological Shift:**
  - Rule B ranking deficit changed from gross loss ₹14,804 to net cohort deficit **₹3,041** (+₹11,763 wins offsetting -₹14,804 losses).
  - Rule C ranking deficit changed from gross loss ₹14,242 to net quartile deficit **₹6,704** (+₹7,538 wins offsetting -₹14,242 losses).
  - Corrected ranking order established: **Rule A (₹30,039) > Rule C (₹6,704) > Rule B (₹3,041)**.
- **Failures Encountered & Fixed:**
  - CRLF script tag extraction bug in test harness resolved.
  - Custom mock DOM missing `querySelector` resolved.

---

### Iteration 4: Testing with Evals

- **Prompt ID:** Iteration 4 / Prompt 2 (Step 148)
- **Timestamp:** 2026-10-30T07:09:54Z (12:39:54 local)
- **Objective:** Execute comprehensive evaluation suite against Step 7 ship bar criteria across automated, edge-case, and boundary scenarios.
- **Prompt Classification:** **Complete Verbatim Prompt** *(2,299 characters, unabridged).*
- **Verbatim Text:**
  > `We have completed the post-audit improvement round for Nubra TradeLens.`  
  > `We are now following Step 7 of the Nubra Product Manager assignment: Testing with Evals.`  
  > `Do not redesign the application or introduce new features.`  
  > `Your objectives:`  
  > `1. Inspect the current implementation and updated test suite.`  
  > `2. Run: node test_app.cjs; python audit_metrics.py`  
  > `3. Verify the reported before-and-after financial calculations.`  
  > `4. Test the following additional scenarios wherever possible:`  
  > `- Mixed instrument position-size comparisons.`  
  > `- Missing or incomplete charges.`  
  > `- Simultaneous exit timestamps.`  
  > `- Multi-month CSV filtering.`  
  > `- Saved commitment retrieval after reload.`  
  > `- All insights dismissed.`  
  > `- Large CSV with at least 1,000 records.`  
  > `- No-winning-trades and no-losing-trades scenarios.`  
  > `- Full end-to-end review flow.`  
  > `5. Test the actual application in a browser if browser automation is available:`  
  > `- Desktop viewport, mobile viewport, CSV file selection, modal open/close, Escape dismissal, focus management, commitment save/reload.`  
  > `6. Verify calculations independently. Do not trust UI values without comparing them to independently computed expected values.`  
  > `7. Produce a final evaluation table containing: Test ID, Test type, Scenario, Expected, Actual, Pass/Fail, Fix applied.`  
  > `8. Update EVALUATION.md with actual results.`  
  > `9. Separate automated tests from manual tests. Do not claim manual browser or human-comprehension testing was performed unless it actually happened.`  
  > `10. List any outstanding issues and deployment blockers.`  
  > `Use this ship bar: 100% of mathematical correctness tests pass; zero unsupported behavioural findings; zero misleading financial-impact claims; at least 4/5 comprehension checks pass when real users are tested; complete main journey works without login.`
- **Execution & Intermediate Failures:**
  - Automated browser command (`Get-Command chrome, msedge`) exited with code 1 in sandboxed environment. Browser automation was unavailable, so browser UI tests were formally classified as required manual pre-deployment checks.
  - Script path resolution error in `eval_scenarios.cjs` (`ENOENT: scratch/index.html`) corrected with absolute workspace path.
- **Outcome:** 
  - `node test_app.cjs`: 9 test blocks, 34 assertions passed (100%).
  - `python audit_metrics.py`: Confirmed all mathematical values.
  - `scratch/eval_scenarios.cjs`: 10 specific programmatic scenarios passed (100%).
  - 1,000-trade benchmark completed in **48ms** (parse: 12ms, generation: 36ms).
  - Updated `EVALUATION.md` with complete 16-row test matrix.

---

### Auxiliary Prompt: Local Execution Guidance

- **Prompt ID:** User Query (Step 185)
- **Timestamp:** 2026-10-30T07:15:00Z (12:45:00 local)
- **Objective:** Provide clear, step-by-step instructions for the user to run, interact with, and verify TradeLens directly in their web browser without technical overhead.
- **Prompt Classification:** **Complete Verbatim Prompt** *(39 characters, unabridged).*
- **Verbatim Text:**
  > `i want to run and check it,how to do it`
- **Guidance Provided:** Explained how to open `index.html` directly in Chrome, Edge, or Firefox, verify preloaded demo KPIs, test habit generation, inspect modal evidence, and test CSV uploads.

---

### Iteration 5: Final UI Polish and Data Visualisations

- **Prompt ID:** Iteration 5 / Prompt 4 (Step 189)
- **Timestamp:** 2026-10-30T07:34:39Z (13:04:39 local)
- **Objective:** Elevate visual hierarchy, typography, and card presentation to professional fintech standards and embed compact, native CSS data visualisations inside the evidence modal.
- **Prompt Classification:** **Verbatim Prompt Excerpt** *(1,150 characters excerpted from the full 6,989-character UI polish prompt).*
- **Verbatim Excerpt:**
  > `# Nubra TradeLens — Final UI Polish and Data Visualisation`  
  > `We have completed the core implementation and evaluation of Nubra TradeLens...`  
  > `I want one focused UI/UX refinement pass to make the application look more polished, professional, intuitive and visually compelling.`  
  > `IMPORTANT: This is a refinement task, NOT a redesign or rebuild.`  
  > `1. Preserve the existing application (static HTML/CSS/JS, zero libraries, unchanged algorithms).`  
  > `2. Improve the visual hierarchy (fintech aesthetic, deep slate/navy, restrained colours, clear typography).`  
  > `3. Improve Monthly Overview (KPI hierarchy, date filter, CSV upload, clear next action).`  
  > `4. Add small, meaningful visualisations to Insight Details:`  
  > `- Rule A: Horizontal duration comparison bar chart (winning median vs losing median).`  
  > `- Rule B: Stacked outcome composition bar (wins vs losses) and outcome split cards.`  
  > `- Rule C: Quartile outcome composition bar and split cards showing gains offsetting losses.`  
  > `5. Improve supporting trade evidence (clean table layout, badges).`  
  > `6. Improve experiment selection and commitment presentation.`  
  > `7. Polish responsive design and accessibility.`
- **Outcome:**
  - Modernised UI layout with refined design tokens (`#0d1b2a` deep slate, `#f8fafc` subtle canvas, `#107548` green, `#b93829` crimson).
  - Implemented pure CSS duration comparison bars for Rule A showing median win duration (`11.0m`) vs loss duration (`32.0m`, `2.9× longer`).
  - Implemented pure CSS outcome composition stacked bars and split metric cards for Rule B (+₹11,763 gains vs -₹14,804 losses) and Rule C (+₹7,538 gains vs -₹14,242 losses).
- **Failures Encountered & Fixed:**
  - Python f-string triple curly brace syntax error in update script.
  - Number format locale assertion mismatch in `test_app.cjs` (`'11m'` vs `'11.0m'`).

---

### Iteration 6: Final Verification and History Reconstruction

- **Prompt ID:** Iteration 6 / Prompt 5 (Step 271)
- **Timestamp:** 2026-10-30T07:55:40Z (13:25:40 local)
- **Objective:** Fully reconstruct and finalise `PROMPT_LOG.md` with complete prompt transcripts, failed attempts, resolutions, and PM decision rationale without altering application code.
- **Prompt Classification:** **Verbatim Prompt Excerpt** *(820 characters excerpted from the full 12,775-character reconstruction prompt).*
- **Verbatim Excerpt:**
  > `# Nubra TradeLens — Reconstruct and Finalise Complete Prompt History`  
  > `We are preparing the final submission for the Nubra Product Manager take-home assignment.`  
  > `Before creating the final one-pager, I want you to thoroughly update and finalise PROMPT_LOG.md.`  
  > `This is an important submission artifact. Nubra explicitly asks candidates to provide the prompts used to build the application, including unsuccessful prompts and iterations.`  
  > `...`  
  > `IMPORTANT:`  
  > `- Do not modify the application code.`  
  > `- Do not redesign anything.`  
  > `- Do not create the one-pager yet.`  
  > `- Do not fabricate prompts, failures, test results or development activities.`  
  > `- Focus exclusively on reconstructing and updating the development history.`
- **Outcome:** Comprehensive overhaul and targeted accuracy review of `PROMPT_LOG.md`.

---

## 6. Failed Attempts and How They Were Resolved

Nubra emphasizes learning from failures. The table and details below document all technical, development-script, test-harness, and environment failures encountered across the TradeLens development lifecycle.

### 6.1 Failure Classification Summary

| # | Step / Phase | Category | Failed Command / Action | Error Observed | Root Cause | Resolution |
|:---:|:---:|:---|:---|:---|:---|:---|
| **F-01** | Step 26 (Audit) | Development Syntax | `python -c "..."` (multiline inline script) | `SyntaxError: unterminated string literal (detected at line 9)` | Windows PowerShell mangled escaped double quotes (`\"`) inside `-c`. | Switched from inline PowerShell commands to running dedicated Python script files. |
| **F-02** | Step 28 (Audit) | Development Script | `python -c @"..."@` (JSON tag search) | `JSONDecodeError: Expecting value: line 1 column 1 (char 0)` | Slicing indices misaligned due to Windows CRLF (`\r\n`) vs LF line endings. | Used dedicated script `scratch/check_data.py` with robust regex boundary detection. |
| **F-03** | Step 36 (Audit) | Character Encoding | `python scratch/deep_verify.py` | `UnicodeEncodeError: 'charmap' codec can't encode character '₹'` | Windows standard console stdout defaults to `cp1252`, which cannot encode the ₹ Rupee symbol. | Added explicit UTF-8 output encoding to Python scripts or omitted unencoded rupee characters from raw console streams. |
| **F-04** | Step 48 (Audit) | Test Harness Defect | `node scratch/test_extended.js` | `TypeError: app.ctx.handleFeedback is not a function` | Test attempted to call `handleFeedback` globally, but it was an anonymous closure attached to the DOM button. | Updated test to simulate DOM click event on the button rather than calling an unexposed global function. |
| **F-05** | Step 94 (Improvement) | Test Harness Defect | `node test_app.cjs` | `SyntaxError: Unexpected identifier 'html' at evalmachine` | Slicing used `html.indexOf('<script>\n')`, which returned -1 on Windows CRLF files, causing HTML doctype to be parsed as JS. | Dynamically located the script tag using `html.indexOf('<script>', html.indexOf('</style>'))`. |
| **F-06** | Step 100 (Improvement) | Test Harness Defect | `node test_app.cjs` | `TypeError: a$(...).querySelector is not a function` | Lightweight Node DOM mock implemented `getElementById` but not `querySelector` on elements. | Accessed `a$('restoreDismissedBtn')` directly via `getElementById`. |
| **F-07** | Step 106 (Improvement) | Workspace File Edit | `edit_file` on `test_app.cjs` | `Encountered error in step execution: target content not found` | Whitespace indentation mismatch between target snippet and file contents. | Replaced edit call with precise multi-line string matching exact file whitespace. |
| **F-08** | Step 142 & 263 | Environment State | `git status` | `fatal: not a git repository (or any of the parent directories): .git` | The project directory is a standalone directory, not an initialized git repository. | Recognized directory structure; relied on file system tools and transcript logs rather than git commands. |
| **F-09** | Step 149 (Evaluation) | Network Incident | Cloud LLM streaming API request | `API error (attempt 1): request failed: write tcp ... wsasend: An existing connection was forcibly closed by the remote host.` | Transient TCP socket reset by cloud API endpoint. | System handled automatic retry; execution resumed normally without code changes. |
| **F-10** | Step 151 (Evaluation) | Sandbox Limitation | `Get-Command chrome, msedge` | `Command exited with code 1. No output.` *(Detailed stderr not emitted by shell).* | Unconfirmed. The non-zero exit code indicates execution failure, but because the PowerShell environment emitted no detailed stderr, the exact root cause cannot be confirmed from shell output alone (though typically caused by binary absence in sandboxed PATH). | Acknowledged that automated browser drivers (Playwright/Puppeteer) cannot be verified in this sandbox; classified browser UI tests as mandatory manual pre-deployment checks. |
| **F-11** | Step 167 (Evaluation) | Path Resolution Issue | `node eval_scenarios.cjs` | `Error: ENOENT: no such file or directory, open '...scratch\index.html'` | Script attempted to open `index.html` relative to `__dirname` (`scratch/`) instead of workspace root. | Corrected path resolution to `path.resolve(__dirname, '../index.html')`. |
| **F-12** | Step 201 (Visual Polish) | Python Script Defect | `python scratch/apply_polish.py` | `SyntaxError: f-string: expecting a valid expression after '{'` | Embedded JS in Python f-string contained triple curly braces (`{{{`), confusing Python's f-string parser. | Escaped curly braces to double braces (`{{` and `}}`) in the generator script. |
| **F-13** | Step 203 (Visual Polish) | CLI Shell Escaping | PowerShell inline replace | `\toast\ : The term '\toast\' is not recognized as the name of a cmdlet` | PowerShell interpreted backslashes and single quotes as command invocations. | Avoided inline PowerShell regex; wrote a dedicated Python file script (`scratch/fix_polish.py`). |
| **F-14** | Step 221 (Visual Polish) | Test Assertion Defect | `node test_app.cjs` | `AssertionError: Rule A chart must display calculated winning and losing medians` | Assertion expected `'11.0m'`, but `Intl.NumberFormat` formatted integer 11 as `'11m'`. | Updated assertion regex to accept both `'11m'` and `'11.0m'` (`/(11(\.0)?m).*?(32(\.0)?m)/`). |
| **F-15** | Step 255 (Evaluation) | Path Resolution Issue | `node scratch/eval_scenarios.cjs` | `Error: Cannot find module '...nubra_tradelens_build\scratch\eval_scenarios.cjs'` | Script resided in persistent brain scratch directory, but was called with relative path from workspace root. | Invoked script using its absolute path. |
| **F-16** | Step 275 (Reconstruction) | Development Syntax | `python -c "..."` (multiline inline script) | `SyntaxError: unterminated string literal (detected at line 7)` | PowerShell unescaped double quotes inside multiline `-c` command string. | Switched to running dedicated Python script file `scratch/extract_prompts.py`. |
| **F-17** | Step 289 (Reconstruction) | Character Encoding | `python scratch/inspect_user_prompts.py` | `UnicodeEncodeError: 'charmap' codec can't encode character '₹'` | Windows standard console output cp1252 encoding failed when printing prompt strings with rupee symbols. | Wrote prompt dumps directly to UTF-8 file (`scratch/prompts_dump.txt`) with `encoding='utf-8'`. |
| **F-18** | Step 291 (Reconstruction) | Tool Execution Error | `write_file` on `scratch/inspect_user_prompts.py` | `Encountered error in tool execution: ... inspect_user_prompts.py already exists.` | Tool safety constraint preventing accidental overwrite without explicit overwrite flag. | Re-invoked tool with parameter `Overwrite: true`. |
| **F-19** | Multiple steps (Evaluation & Review) | Network / Environment | Cloud LLM streaming API calls | `API error (attempt 1): request failed: write tcp ... wsasend: An existing connection was forcibly closed by the remote host` / transient DNS disconnects | Transient transport-layer TCP socket resets and cloud API streaming disconnects during model turn generation. | The agent runtime automatically retried requests upon socket disconnects; no application code or repository files were affected. |

---

## 7. Evolution of Product Thinking & Key PM Decisions

TradeLens is not merely a technical implementation; it represents deliberate product trade-offs designed to solve a retail trader's behavioural dilemma within the constraints of Problem 03.

### 1. Deterministic Heuristic Rules vs. Unconstrained AI Coaching
- **Decision:** Use transparent, deterministic mathematical rules rather than sending trade histories to an LLM prompt.
- **Rationale:** Retail traders are intensely skeptical of automated trading advice. If an LLM generates generic advice like *"You seem impatient in the afternoon"*, the trader has no way to verify whether the AI hallucinated. With deterministic rules (e.g. holding duration > median winning duration), every insight links to verifiable trade IDs, entry/exit timestamps, and rupee amounts. This builds user trust through auditability.

### 2. Limiting to Three Behavioural Patterns vs. Exhaustive Dashboard
- **Decision:** Strictly restrict findings to the top two or three habits.
- **Rationale:** The candidate guide explicitly warns against building a full analytics dashboard. Retail traders suffer from cognitive overload; presenting 15 different trading metrics leads to paralysis, not action. By focusing on the 2 or 3 habits causing the greatest net financial drag, TradeLens provides clear prioritisation.

### 3. Net Cohort Deficit Ranking vs. One-Sided Gross Losses (Prioritisation Heuristic)
- **Decision:** Rank habits by each rule's cohort-level financial result: observed net cohort deficit for Rules B and C, and flagged losing-trade losses for Rule A.
- **Prioritisation Heuristic vs Causal Comparison:** The resulting A > C > B ranking serves strictly as an educational prioritisation heuristic to direct trader attention to the areas of greatest drag. It is **not** a like-for-like causal comparison: Rule A measures only flagged losing trades (duration > winning median), whereas Rules B and C measure the net financial result of their full qualifying cohorts (where profitable trades partially offset losses). Because these underlying measurement bases differ, the rupee amounts are not directly interchangeable.
- **Rationale:** 
  - *Rule A (Holding Losers):* Evaluates flagged losing trades whose hold duration exceeded the median hold of winning trades. By definition, all 24 flagged trades are losses, so the cohort deficit (₹30,039) equals the sum of these losses.
  - *Rule B (Trades Opened Shortly After Loss):* Evaluates the complete qualifying cohort of 25 trades opened within 10 minutes of a loss. In the synthetic dataset, this cohort contains 13 profitable trades (+₹11,763) and 12 losing trades (-₹14,804). Ranking by gross losses (₹14,804) claimed the habit was twice as destructive as it actually was (net cohort deficit was only ₹3,041, representing a 52% win rate).
  - *Rule C (Large Positions):* Evaluates the complete qualifying cohort of 16 trades in the top quartile (>= Q75). It contains 8 profitable trades (+₹7,538) and 8 losing trades (-₹14,242). True net cohort deficit is ₹6,704.
  - *Non-Causal Language:* These amounts reflect observed historical cohort deficits, not guaranteed avoidable losses.
  - *Overlapping Cohorts Warning:* Trade cohorts can overlap (e.g. a large trade opened within 10 minutes of a loss that is held too long). Therefore, **insight amounts must never be summed together** to avoid double-counting.

### 4. Heuristic Instrument Comparability Safeguards (Not Full Exposure Normalisation)
- **Decision:** Validate instrument comparability before benchmarking position sizes in Rule C, suppressing the insight if disparate instruments are mixed.
- **Rationale & Scope:** Comparing raw rupee notional between an index option (e.g. ₹50,000 premium) and an equity position (e.g. ₹2,500,000 share purchase) produces meaningless quartiles. TradeLens verifies whether instruments belong to the recognized Indian index derivatives family (`NIFTY`, `BANKNIFTY`, `FINNIFTY`, `MIDCPNIFTY`, `SENSEX`, `BANKEX`) or represent a single contract. If comparability is compromised, the rule suppresses itself and tells the user why.
- **Important Limitation:** This comparability check is an operational heuristic safeguard. It does **not** constitute complete economic exposure normalisation across all derivative contracts (e.g. it does not compute delta-adjusted exposure, strike moneyness adjustments, or margin-weighted leverage across different option strikes and expiries).

### 5. Inspectable Evidence Over Unexplained Scores
- **Decision:** Provide an interactive evidence drawer with every finding, showing full calculation formulas, sample counts, and supporting trade tables.
- **Rationale:** Proprietary "behaviour scores" (e.g. "Discipline Score: 64/100") frustrate traders because they offer no path to self-correction. Inspectable evidence allows the trader to click **Inspect evidence**, see the exact 24 trades that breached their winning holding duration, and review the actual market timestamps.

### 6. Compact Native Visualisations vs. Heavy Chart Libraries
- **Decision:** Embed compact, CSS-driven visualisations inside the evidence modal rather than integrating external charting packages like Chart.js or D3.
- **Rationale:** External charting libraries add 100KB+ of script overhead, risk bundle breakage, and tend to draw attention away from the core textual evidence. Compact CSS bars (duration comparison, win/loss stacked ratios) give instant visual anchors in <2KB of code without external dependencies.

### 7. Client-Side Post-Trade Review vs. Live Brokerage Execution
- **Decision:** Deliberately exclude live broker API order routing or automated stop-loss enforcement.
- **Rationale:** Live trade execution introduces severe regulatory, security, and latency burdens that distract from the core product hypothesis. TradeLens is designed as a calm, reflective post-trade experience where traders review completed activity outside market hours.

---

## 8. Project File Change Matrix

| File | Baseline (Iter 0) | Audit & Testing (Iter 1–2) | Post-Audit Build (Iter 3) | Evaluated & Polished (Iter 4–6) |
|:---|:---|:---|:---|:---|
| [`index.html`](./index.html) | Baseline single-page app with embedded demo data and gross-loss ranking. | Audited; identified ranking flaws, missing persistence, and navigation bugs. | Implemented net deficit ranking, comparability guards, $O(N \log N)$ search, `localStorage` persistence, and period filter. | Refined fintech visual hierarchy; added native CSS duration bars and cohort outcome split visualisations. |
| [`sample_trades.csv`](./sample_trades.csv) | 60 completed round-trip trades (Aug–Oct 2026). | Confirmed 100% data parity across CSV, JSON, and embedded HTML. | Preserved exact data contract; used for regression testing. | Verified identical values across all test suites. |
| [`sample_trades.json`](./sample_trades.json) | Identical 60-trade JSON representation. | Verified 100% field parity with CSV. | Preserved for programmatic test consumption. | Verified intact. |
| [`generate_data.py`](./generate_data.py) | Python synthetic tradebook generator. | Inspected; confirmed deterministic output. | Maintained as reproducible generator script. | Preserved intact. |
| [`audit_metrics.py`](./audit_metrics.py) | Standalone mathematical audit script. | Audited baseline metrics; discovered gross-loss ranking bug. | Updated to independently compute cohort net deficits and verify ranking A > C > B. | Executed as independent gold-standard validation script. |
| [`test_app.cjs`](./test_app.cjs) | Initial lightweight Node.js interaction test harness. | Identified test harness limitations (CRLF parsing, missing element methods). | Expanded to 9 comprehensive test blocks covering all functional fixes. | Updated assertions to verify new modal visualisations and ranking order (34 assertions). |
| [`DATA_DICTIONARY.md`](./DATA_DICTIONARY.md) | Initial column descriptions and rule summaries. | Audited; identified missing definitions for cohort deficit and comparability. | Fully rewritten with exact mathematical definitions, schema contracts, and ranking rules. | Preserved as official project data contract. |
| [`EVALUATION.md`](./EVALUATION.md) | Preliminary evaluation checklist. | Audited; identified unverified browser claims. | Structured comprehensive 16-test evaluation matrix with before/after financial table. | Updated with actual test results, separating automated from manual tests and deployment blockers. |
| [`README.md`](./README.md) | Basic setup instructions. | Audited for consistency with actual codebase. | Updated local run instructions, project architecture, and limitations. | Updated with details on modal visualisations, ranking methodology, and caveats. |
| [`PROMPT_LOG.md`](./PROMPT_LOG.md) | Brief summary disclosure. | Expanded iteration notes. | Documented post-audit fixes. | Reconstructed into complete, transparent, 10-section chronological prompt history. |

---

## 9. Test and Validation History

### 9.1 Automated Test Execution Summary

#### 1. Node.js Comprehensive Integration Suite (`node test_app.cjs`)
- **Status:** **100% PASS (9 test blocks, 34 assertions)**
  - *Block 1 (Correctness & Ranking):* Verified exact cohort net deficits: Rule A (₹30,039) > Rule C (₹6,704) > Rule B (₹3,041).
  - *Block 2 (Commitment Persistence):* Verified retrieval and DOM rendering of active commitments from `localStorage`.
  - *Block 3 (Comparability Guard):* Verified suppression of Rule C when disparate instruments (50× scale disparity) are present.
  - *Block 4 (Deterministic Logic):* Verified exclusion of ambiguous simultaneous exits at the identical timestamp.
  - *Block 5 (Multi-Month Filter):* Verified segmentation of multi-month datasets into discrete months.
  - *Block 6 (Evidence Modal Consistency):* Verified table row counts strictly match displayed statistics (A: 24, B: 25, C: 16).
  - *Block 7 (Modal Visualisations):* Verified dynamic rendering of duration bars and cohort outcome split bars.
  - *Block 8 (Modal Accessibility):* Verified modal closes cleanly on `Escape` key and restores focus.
  - *Block 9 (Dismissal Empty State):* Verified distinction between user dismissal and insufficient data.

#### 2. Standalone Independent Mathematical Audit (`python audit_metrics.py`)
- **Status:** **100% PASS**
  - Confirmed 60 trades (28 wins, 32 losses).
  - Confirmed Gross P&L: -₹12,050.00; Charges: ₹2,700.00; Net P&L: -₹14,750.00.
  - Confirmed Rule A: Median winning hold = 11.0m, Median losing hold = 32.0m, Flagged = 24, Net deficit = ₹30,039.00.
  - Confirmed Rule B: Qualifying = 25, Losses = 12 (-₹14,804.00), Wins = 13 (+₹11,763.00), Net deficit = ₹3,041.00.
  - Confirmed Rule C: Q75 cutoff = ₹70,500.00, Qualifying = 16, Losses = 8 (-₹14,242.00), Wins = 8 (+₹7,538.00), Net deficit = ₹6,704.00.
  - Verified ranking order: **Rule A > Rule C > Rule B**.

#### 3. Programmatic Evaluation Scenarios (`eval_scenarios.cjs`)
- **Status:** **100% PASS (10/10 scenarios)**
  - *EV-01 (Mixed Disparate Instruments):* Rule C suppressed with explanatory 50.0× scale disparity notice.
  - *EV-02 (Empty Charges):* Rejected invalid CSV row with specific schema error message.
  - *EV-03 (Simultaneous Exits):* Excluded conflicting simultaneous trades; prevented spurious post-loss flag.
  - *EV-04 (Multi-Month Filter):* Correctly segmented 3 calendar months (Aug, Sep, Oct 2026).
  - *EV-05 (Commitment Reload):* Retrieved saved commitment and active badge on simulated revisit.
  - *EV-06 (Dismiss All Insights):* Rendered dismissal-specific empty state with functional restore button.
  - *EV-07 (1,000-Trade Scale Test):* Parsed and generated insights in **48ms** (<500ms bar).
  - *EV-08A (All-Losses Dataset):* Suppressed Rule A cleanly (zero crashes or division-by-zero).
  - *EV-08B (All-Wins Dataset):* Suppressed all habit rules (zero false positives).
  - *EV-09 (Full E2E Flow):* Executed complete journey start-to-finish without login or external calls.

---

### 9.2 Separation of Automated vs. Manual Testing

To maintain strict intellectual honesty, automated and manual tests are clearly separated:

1. **Automated Verification (Completed & Passing):**
   - All calculations, ranking algorithms, DOM state transitions, persistence mechanics, input validation, and scale benchmarks were automated and executed via Node.js and Python.
2. **User Synthetic Dataset Testing (Completed by User):**
   - In Iteration 2, the user manually uploaded and verified the three custom synthetic test files (`01_clear_pattern_demo.csv`, `02_clean_control.csv`, `03_edge_mixed_instruments_and_ties.csv`) in the running browser interface.
3. **Manual Pre-Deployment Checks (Pending Prior to Public Release):**
   - *Cross-Device Responsive Inspection:* Physically opening `index.html` on Chrome/Safari at mobile (375px/390px) and desktop viewports.
   - *OS File Dialogue Picker:* Manually uploading local CSV files via OS file picker.
   - *Real-User Comprehension Test:* The Nubra candidate guide specifies testing with 5 real users (3 active traders, 2 non-traders) to ensure at least 4 out of 5 understand that rupee amounts represent *observed historical cohort deficits* rather than *guaranteed recoverable money*. **Status:** Not yet conducted with human subjects; documented as a required step prior to live production rollout.
   - *Synthetic vs. Real Data Distinction:* All tests used synthetic tradebook data. No proprietary Nubra customer data was used.

---

## 10. Current Application Status and Known Limitations

### 10.1 Ship Bar Compliance Status

| Ship Bar Criterion | Target | Actual Result | Status |
|:---|:---:|:---:|:---:|
| Mathematical correctness tests | 100% | 100% (Node, Python, Scenario suites) | **PASSED** |
| Unsupported behavioural findings | 0 | 0 (Strict sample size & comparability guards) | **PASSED** |
| Misleading financial-impact claims | 0 | 0 (Cohort net deficit used; causation disclaimed) | **PASSED** |
| Complete main journey without login | Yes | Verified end-to-end | **PASSED** |
| Human comprehension check (≥ 4/5) | ≥ 4/5 | **Pending real-user testing** | **BLOCKER** |
| Public HTTPS deployment | Active URL | **Not yet deployed (local build only)** | **BLOCKER** |

*Overall Ship Bar Evaluation:* **Partially Met**. All automated correctness, edge-case, and user-flow requirements are 100% satisfied. Public deployment and real-user comprehension testing remain pending deployment blockers.

### 10.2 Known Architectural Limitations
1. **Completed Round-Trip Requirement:**  
   TradeLens requires each CSV row to represent a completed round-trip trade (`entry_time`, `exit_time`, `position_size_inr`, `gross_pnl_inr`, `charges_inr`). Traders whose brokers export raw order executions (multiple partial fills per trade) must aggregate fills into completed round-trips prior to upload.
2. **Sub-Minute Order Sequencing:**  
   Where multiple orders share the identical minute without seconds or sequence IDs, execution chronology relies on row order in the CSV. Ambiguous ties with conflicting P&L outcomes are excluded from Rule B triggering to prevent false positives.
3. **Local-Only Commitment Storage:**  
   Commitments are persisted in `localStorage`. Clearing browser cache or switching devices will reset the active commitment.
4. **Heuristic Instrument Comparability (Not Full Exposure Normalisation):**  
   Rule C's comparability check verifies membership within the recognized Indian index derivatives family or restricts analysis to single instruments. This is an operational heuristic safeguard to prevent comparing equity shares with options premiums; it does not perform complete economic exposure normalisation (e.g. delta-weighting options contracts, option moneyness adjustments, or margin-weighted leverage calculations across different strikes and expiries).

---
*End of PROMPT_LOG.md — Generated for Nubra Product Manager Take-Home Evaluation.*
