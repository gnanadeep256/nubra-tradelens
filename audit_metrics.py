"""Independent audit of the TradeLens synthetic sample and insight rules."""
import csv
from datetime import datetime
from math import ceil
from pathlib import Path
from statistics import median

p = Path(__file__).with_name('sample_trades.csv')
trades = []
with p.open(newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        row['entry'] = datetime.fromisoformat(row['entry_time'])
        row['exit'] = datetime.fromisoformat(row['exit_time'])
        row['position'] = float(row['position_size_inr'])
        row['gross'] = float(row['gross_pnl_inr'])
        row['charges'] = float(row['charges_inr'])
        row['net'] = row['gross'] - row['charges']
        row['duration'] = (row['exit'] - row['entry']).total_seconds() / 60
        trades.append(row)
trades.sort(key=lambda t: t['entry'])
assert len(trades) == 60
assert len({t['trade_id'] for t in trades}) == len(trades)
assert all(t['exit'] > t['entry'] and t['position'] > 0 and t['charges'] >= 0 for t in trades)

gross = sum(t['gross'] for t in trades)
charges = sum(t['charges'] for t in trades)
net = gross - charges
wins = [t for t in trades if t['net'] > 0]
losses = [t for t in trades if t['net'] < 0]
assert (gross, charges, net) == (-12050, 2700, -14750)

# Rule A: losing durations greater than the median duration of profitable trades.
winning_median = median(t['duration'] for t in wins)
losing_median = median(t['duration'] for t in losses)
flagged_a = [t for t in losses if t['duration'] > winning_median]
impact_a = abs(sum(t['net'] for t in flagged_a))
cohort_deficit_a = impact_a
assert (len(flagged_a), cohort_deficit_a, impact_a, winning_median, losing_median) == (24, 30039, 30039, 11, 32)

# Rule B: nearest prior completed trade(s) with deterministic simultaneous exit handling
by_exit = sorted(trades, key=lambda t: t['exit'])
flagged_b = []
for t in trades:
    prior = [p for p in trades if p['trade_id'] != t['trade_id'] and p['exit'] <= t['entry']]
    if not prior:
        continue
    max_exit = max(p['exit'] for p in prior)
    tied = [p for p in prior if p['exit'] == max_exit]
    gap = (t['entry'] - max_exit).total_seconds() / 60
    if 0 <= gap <= 10:
        has_loss = any(p['net'] < 0 for p in tied)
        has_win = any(p['net'] > 0 for p in tied)
        if has_loss and not has_win:
            flagged_b.append(t)

losses_b = [t for t in flagged_b if t['net'] < 0]
wins_b = [t for t in flagged_b if t['net'] > 0]
impact_b_losses = abs(sum(t['net'] for t in losses_b))
impact_b_wins = sum(t['net'] for t in wins_b)
cohort_net_b = sum(t['net'] for t in flagged_b)
cohort_deficit_b = abs(cohort_net_b) if cohort_net_b < 0 else 0
assert (len(flagged_b), len(losses_b), len(wins_b)) == (25, 12, 13)
assert (cohort_deficit_b, impact_b_losses, impact_b_wins) == (3041, 14804, 11763)

# Rule C: nearest-rank 75th-percentile position notional within comparable index derivatives family.
INDEX_FAMILY = {'NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'}
assert {t['instrument'].upper() for t in trades}.issubset(INDEX_FAMILY)

ordered = sorted(t['position'] for t in trades)
q75 = ordered[ceil(.75 * len(ordered)) - 1]
large = [t for t in trades if t['position'] >= q75]
large_losses = [t for t in large if t['net'] < 0]
large_wins = [t for t in large if t['net'] > 0]
impact_c_losses = abs(sum(t['net'] for t in large_losses))
impact_c_wins = sum(t['net'] for t in large_wins)
cohort_net_c = sum(t['net'] for t in large)
cohort_deficit_c = abs(cohort_net_c) if cohort_net_c < 0 else 0
assert (q75, len(large), len(large_losses), len(large_wins)) == (70500, 16, 8, 8)
assert (cohort_deficit_c, impact_c_losses, impact_c_wins) == (6704, 14242, 7538)

# Ranking by Cohort Net Deficit: A (30,039) > C (6,704) > B (3,041)
assert cohort_deficit_a > cohort_deficit_c > cohort_deficit_b

print('Independent sample audit: PASS')
print(f'Trades={len(trades)}; wins={len(wins)}; losses={len(losses)}')
print(f'Gross={gross}; charges={charges}; net={net}')
print(f'A: median winner={winning_median}m; median loser={losing_median}m; flagged={len(flagged_a)}; cohort deficit={cohort_deficit_a}')
print(f'B: qualifying={len(flagged_b)}; losses={len(losses_b)} ({impact_b_losses}); wins={len(wins_b)} (+{impact_b_wins}); cohort deficit={cohort_deficit_b}')
print(f'C: Q75={q75}; qualifying={len(large)}; losses={len(large_losses)} ({impact_c_losses}); wins={len(large_wins)} (+{impact_c_wins}); cohort deficit={cohort_deficit_c}')
print('Ranking (by cohort deficit): A > C > B')
