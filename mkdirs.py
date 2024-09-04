from pathlib import Path

for idx_week, num_parts in enumerate((5, 4, 4, 6, 4, 4, 4, 4, 6, 4), start=1):

    for idx_part in range(1, 1+num_parts):
        _dir = Path(f"./exercises/week{idx_week:0>1}/part{idx_part}")
        _dir.mkdir(parents=True, exist_ok=True)
