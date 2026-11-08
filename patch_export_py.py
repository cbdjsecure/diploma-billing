with open(r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\server\routes\export-excel.py", "r", encoding="utf-8") as f:
    text = f.read()

# Replace if not disc_info or not disc_info.get('active'):
old_block = """                disc_info = disciplines.get(disc_key)
                if not disc_info or not disc_info.get('active'):
                    continue
                disc_items = disc_info.get('items') or []
                if not disc_items:
                    continue"""

new_block = """                disc_info = disciplines.get(disc_key)
                if not disc_info:
                    continue
                if disc_info.get('active') is False:
                    continue
                disc_items = disc_info.get('items') or []
                if not disc_items:
                    continue
                if disc_info.get('active') is None:
                    has_examinees = any((int(it.get('old_count') or 0) + int(it.get('new_count') or 0)) > 0 for it in disc_items)
                    if not has_examinees:
                        continue"""

if old_block in text:
    text = text.replace(old_block, new_block, 1)
    with open(r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\server\routes\export-excel.py", "w", encoding="utf-8") as f:
        f.write(text)
    print("REPLACED in render_images")
else:
    print("Block not found in render_images")

# Also for ZIP export
old_zip = """        for disc_key in ['indian', 'western', 'yoga']:
            disc_info = disciplines.get(disc_key)
            if not disc_info or not disc_info.get('active'):
                continue

            disc_items = disc_info.get('items') or []
            if not disc_items:
                continue"""

new_zip = """        for disc_key in ['indian', 'western', 'yoga']:
            disc_info = disciplines.get(disc_key)
            if not disc_info:
                continue
            if disc_info.get('active') is False:
                continue
            disc_items = disc_info.get('items') or []
            if not disc_items:
                continue
            if disc_info.get('active') is None:
                has_examinees = any((int(it.get('old_count') or 0) + int(it.get('new_count') or 0)) > 0 for it in disc_items)
                if not has_examinees:
                    continue"""

if old_zip in text:
    text = text.replace(old_zip, new_zip, 1)
    with open(r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\server\routes\export-excel.py", "w", encoding="utf-8") as f:
        f.write(text)
    print("REPLACED in zip export")
else:
    print("Block not found in zip export")
