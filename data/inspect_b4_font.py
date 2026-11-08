import zipfile, re

with zipfile.ZipFile(r"C:\Users\SASWATA\.gemini\antigravity\brain\feb72794-f641-45b4-8b93-81b9308c82a3\.user_uploaded\media_1794145659400_b7dbcb90.xlsx") as z:
    st = z.read("xl/styles.xml").decode("utf-8")
    s1 = z.read("xl/worksheets/sheet1.xml").decode("utf-8")
    b4 = re.search(r'<c r="B4"[^>]*s="(\d+)"', s1)
    if b4:
        s_id = int(b4.group(1))
        xfs = re.findall(r'<xf .*?>', st)
        font_id = int(re.search(r'fontId="(\d+)"', xfs[s_id]).group(1))
        fonts = re.findall(r'<font>.*?</font>', st)
        print("Font def:", fonts[font_id])

