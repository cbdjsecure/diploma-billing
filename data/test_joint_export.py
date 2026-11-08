import json
import subprocess
import os

script_dir = r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\server\routes"
py_path = os.path.join(script_dir, "export-excel.py")
template_path = r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\server\template.xlsx"
out_zip = r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_joint_export.zip"

payload = {
    "action": "export",
    "templatePath": template_path,
    "outPath": out_zip,
    "bill": {
        "id": 8888,
        "centre_code": "1011",
        "centre_short_code": "1011",
        "centre_name": "TEST JOINT CENTRE",
        "teacher_name": "SRI TEST",
        "place": "KOLKATA",
        "category": "joint",
        "is_joint": 1,
        "zone": "zone1_ne_wb",
        "total_discount_percent": 35.0,
        "slab_discount_percent": 35.0,
        "extra_less_percent": 0.0,
        "seasonal_discount_percent": 0.0,
        "joint_data": json.dumps({
            "combined_examinees": 50,
            "slab_name": "36-99",
            "disciplines": {
                "indian": {
                    "active": True,
                    "items": [
                        {"level_name": "Praveshika", "exam_fee": 270, "old_count": 0, "new_count": 25, "convocation_fee": 0}
                    ],
                    "examinerFeeAmount": 0
                },
                "western": {
                    "active": True,
                    "items": [
                        {"level_name": "Initial", "exam_fee": 300, "old_count": 0, "new_count": 25, "convocation_fee": 0}
                    ],
                    "examinerFeeAmount": 0
                }
            }
        })
    },
    "discountSlabs": []
}

p = subprocess.Popen(["python", py_path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, stderr = p.communicate(json.dumps(payload))
print("STDOUT:", stdout)
print("STDERR:", stderr)
