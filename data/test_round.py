import json
import subprocess
import os

script_dir = r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\server\routes"
py_path = os.path.join(script_dir, "export-excel.py")
template_path = r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\server\template.xlsx"
out_xlsx = r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_round_export.xlsx"

# 810 * 0.35 = 283.5 -> should round off to 284!
# 810 - 284 = 526!
payload = {
    "action": "export",
    "templatePath": template_path,
    "outPath": out_xlsx,
    "bill": {
        "id": 9999,
        "centre_code": "1011",
        "centre_short_code": "1011",
        "centre_name": "TEST CENTRE",
        "teacher_name": "SRI TEST",
        "place": "KOLKATA",
        "category": "indian",
        "zone": "zone1_ne_wb",
        "total_discount_percent": 35.0,
        "slab_discount_percent": 35.0,
        "extra_less_percent": 0.0,
        "seasonal_discount_percent": 0.0,
        "examiner_fee_amount": 500,
        "examiner_fee_note": "Examiner fees for 2 school"
    },
    "items": [
        {"level_name": "Praveshika", "exam_fee": 270, "old_count": 0, "new_count": 3, "convocation_fee": 0},
        {"level_name": "All India Churamoni Examination", "exam_fee": 2200, "old_count": 0, "new_count": 0, "convocation_fee": 0}
    ]
}

p = subprocess.Popen(["python", py_path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, stderr = p.communicate(json.dumps(payload))
print("STDOUT:", stdout)
print("STDERR:", stderr)
