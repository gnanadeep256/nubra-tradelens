import csv
from datetime import date, datetime, timedelta
from pathlib import Path

OUT = Path(__file__).parent / 'sample_trades.csv'

# One row represents one normalised, fully completed round-trip trade.
# Synthetic dataset deliberately plants three detectable patterns.
start = date(2026, 9, 30)
days=[]
d=start
while len(days)<20:
    if d.weekday()<5:
        days.append(d)
    d += timedelta(days=1)

rows=[]
trade_no=1
for day_idx, day in enumerate(days):
    # First trade: 12 losses across the sample; losing holds are deliberately longer.
    specs=[]
    t1_loss = (day_idx % 5 in (0,1,3))  # 12/20
    specs.append(('NIFTY', t1_loss, 35 if t1_loss else 12, 9, 45_000 + (day_idx%4)*2_500))

    # Second trade starts 5 minutes after a loss, otherwise after a longer gap.
    t2_loss = (day_idx % 3 != 1)  # 13/20
    specs.append(('BANKNIFTY', t2_loss, 32 if t2_loss else 11, 10, 25_000 + (day_idx%5)*1_800))

    # Third trade starts 5 minutes after a losing second trade, otherwise after 25 minutes.
    t3_loss = (day_idx % 4 == 0 or day_idx % 7 == 0)  # 5/20
    specs.append(('FINNIFTY', t3_loss, 28 if t3_loss else 10, 11, 20_000 + (day_idx%6)*1_500))

    # Create a deterministic sequence with enough high-notional losing positions in the top quartile.
    for slot,(instrument,is_loss,duration,entry_hour,base_size) in enumerate(specs):
        # A minority of losing trades are exited quickly; the pattern is not universal.
        if is_loss and trade_no % 4 == 0:
            duration = 8
        # The first 15 trades are deliberately assigned much larger notionals, including 10 losses.
        if trade_no <= 15:
            size = 105_000 + trade_no*2_000
        else:
            size = base_size
        # Make some later trades moderately larger to avoid a completely artificial binary split.
        if trade_no > 15 and trade_no % 11 == 0:
            size += 18_000

        if slot==0:
            entry_dt=datetime.combine(day, datetime.min.time()).replace(hour=9,minute=15)
        elif slot==1:
            prev_exit = rows[-1]['exit_time']
            prev_dt=datetime.fromisoformat(prev_exit)
            gap=5 if prev_dt and rows[-1]['net_pnl_inr'] < 0 else 25
            entry_dt=prev_dt+timedelta(minutes=gap)
        else:
            prev_dt=datetime.fromisoformat(rows[-1]['exit_time'])
            gap=5 if rows[-1]['net_pnl_inr'] < 0 else 25
            entry_dt=prev_dt+timedelta(minutes=gap)

        exit_dt=entry_dt+timedelta(minutes=duration)
        # Repeatable P&L values; large positions have proportionately larger losses.
        if is_loss:
            gross = -(650 + (trade_no*73)%850)
            if size >= 105_000:
                gross -= 700
        else:
            gross = 550 + (trade_no*91)%900
        charges = 35 + (trade_no%5)*5
        net = gross - charges
        rows.append({
            'trade_id': f'T{trade_no:03d}',
            'instrument': instrument,
            'entry_time': entry_dt.isoformat(timespec='minutes'),
            'exit_time': exit_dt.isoformat(timespec='minutes'),
            'position_size_inr': size,
            'gross_pnl_inr': gross,
            'charges_inr': charges,
            'net_pnl_inr': net,
        })
        trade_no += 1

# Add net_pnl as a convenience column for inspection; the app independently derives it from gross less charges.
with OUT.open('w', newline='', encoding='utf-8') as f:
    output_fields=['trade_id','instrument','entry_time','exit_time','position_size_inr','gross_pnl_inr','charges_inr']
    w=csv.DictWriter(f, fieldnames=output_fields)
    w.writeheader(); w.writerows([{k:r[k] for k in output_fields} for r in rows])

print(f'Wrote {len(rows)} trades to {OUT}')
print('Gross P&L:', sum(r['gross_pnl_inr'] for r in rows))
print('Charges:', sum(r['charges_inr'] for r in rows))
print('Net P&L:', sum(r['net_pnl_inr'] for r in rows))
print('Wins:', sum(r['net_pnl_inr']>0 for r in rows), 'Losses:', sum(r['net_pnl_inr']<0 for r in rows))
