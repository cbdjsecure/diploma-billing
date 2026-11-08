import openpyxl, subprocess, json, os

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.abspath(os.path.join(script_dir, '..'))

def run_test(name, payload):
    out_xlsx = os.path.join(project_dir, f'data/scenario_{name}.xlsx')
    payload['outPath'] = out_xlsx
    payload['templatePath'] = os.path.join(project_dir, 'server/template.xlsx')
    payload['action'] = 'export'
    
    p = subprocess.run(
        ['python', os.path.join(project_dir, 'server/routes/export-excel.py')],
        input=json.dumps(payload),
        text=True,
        capture_output=True
    )
    if 'SUCCESS' not in p.stdout:
        print(f"FAILED {name}: {p.stderr}")
        return False

    wb = openpyxl.load_workbook(out_xlsx, data_only=False)
    ws = wb.active
    rows = []
    for r in range(10, 35):
        vals = [f"{ws.cell(r, c).coordinate}={repr(ws.cell(r, c).value)}" for c in range(1, 7) if ws.cell(r, c).value is not None]
        if vals:
            rows.append((r, ws.cell(r, 1).value, ws.cell(r, 5).value))
            print(f"[{name}] R{r}: {ws.cell(r, 1).value} | E{r}={ws.cell(r, 5).value}")
    
    final_cell = [r for r in rows if r[1] == 'Total Examinee--']
    print(f"[{name}] FINAL FORMULA: {final_cell[0] if final_cell else 'NOT FOUND'}")
    print("-" * 60)
    return True

# Scenario 1: Discount 35%, Kolkata zone (has convo), Examiner 1200
run_test("s1_kolkata_disc_ex", {
    "bill": {
        "centre_short_code": "1111",
        "centre_name": "Kolkata Centre",
        "session": "2026-27",
        "zone": "zone4_kolkata",
        "total_discount_percent": 35,
        "slab_discount_percent": 35,
        "extra_less_percent": 0,
        "seasonal_discount_percent": 0,
        "examiner_fee_amount": 1200,
        "examiner_fee_note": "Examiner fees for 2 school"
    },
    "items": [
        {"level_name": "Adya", "exam_fee": 290, "old_count": 5, "new_count": 2, "convocation_fee": 0},
        {"level_name": "Purna", "exam_fee": 400, "old_count": 4, "new_count": 4, "convocation_fee": 230}
    ]
})

# Scenario 2: Discount 0%, West Bengal zone (no convo), Examiner 0
run_test("s2_wb_nodisc_noex", {
    "bill": {
        "centre_short_code": "2222",
        "centre_name": "WB Centre",
        "session": "2026-27",
        "zone": "zone1_ne_wb",
        "total_discount_percent": 0,
        "slab_discount_percent": 0,
        "extra_less_percent": 0,
        "seasonal_discount_percent": 0,
        "examiner_fee_amount": 0,
        "examiner_fee_note": ""
    },
    "items": [
        {"level_name": "Adya", "exam_fee": 195, "old_count": 2, "new_count": 1, "convocation_fee": 0},
        {"level_name": "Purna", "exam_fee": 265, "old_count": 3, "new_count": 2, "convocation_fee": 230}
    ]
})

# Scenario 3: Discount 20%, Yoga bill (no convo), Examiner 800
run_test("s3_yoga_disc_ex", {
    "bill": {
        "centre_short_code": "3333",
        "centre_name": "Yoga Kendra",
        "session": "2026-27",
        "category": "yoga",
        "zone": "yoga",
        "total_discount_percent": 20,
        "slab_discount_percent": 20,
        "extra_less_percent": 0,
        "seasonal_discount_percent": 0,
        "examiner_fee_amount": 800,
        "examiner_fee_note": "Examiner fees for 1 school"
    },
    "items": [
        {"level_name": "1st", "exam_fee": 285, "old_count": 10, "new_count": 5, "convocation_fee": 0},
        {"level_name": "2nd", "exam_fee": 310, "old_count": 5, "new_count": 5, "convocation_fee": 0}
    ]
})

# Scenario 4: Discount 0%, Kolkata zone (has convo), Examiner 500
run_test("s4_kolkata_nodisc_ex", {
    "bill": {
        "centre_short_code": "4444",
        "centre_name": "Kolkata Centre 2",
        "session": "2026-27",
        "zone": "zone4_kolkata",
        "total_discount_percent": 0,
        "slab_discount_percent": 0,
        "extra_less_percent": 0,
        "seasonal_discount_percent": 0,
        "examiner_fee_amount": 500,
        "examiner_fee_note": "Examiner fees for 1 school"
    },
    "items": [
        {"level_name": "Adya", "exam_fee": 290, "old_count": 1, "new_count": 1, "convocation_fee": 0},
        {"level_name": "Purna", "exam_fee": 400, "old_count": 2, "new_count": 1, "convocation_fee": 230}
    ]
})

