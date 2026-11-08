import zipfile, re, os

template_path = r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_out.xlsx"
out_test = r"C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_inject.xlsx"

# 1. Read pristine template parts
with zipfile.ZipFile(template_path, 'r') as z_tmpl:
    orig_media = z_tmpl.read('xl/media/image1.png') if 'xl/media/image1.png' in z_tmpl.namelist() else None
    orig_drawing = z_tmpl.read('xl/drawings/drawing1.xml') if 'xl/drawings/drawing1.xml' in z_tmpl.namelist() else None
    orig_draw_rels = z_tmpl.read('xl/drawings/_rels/drawing1.xml.rels') if 'xl/drawings/_rels/drawing1.xml.rels' in z_tmpl.namelist() else None
    orig_sheet_rels = z_tmpl.read('xl/worksheets/_rels/sheet1.xml.rels') if 'xl/worksheets/_rels/sheet1.xml.rels' in z_tmpl.namelist() else None
    
    # Read original headerFooter from sheet1.xml
    orig_sheet1_xml = z_tmpl.read('xl/worksheets/sheet1.xml').decode('utf-8')
    hf_match = re.search(r'<headerFooter.*?</headerFooter>', orig_sheet1_xml, re.DOTALL)
    orig_hf = hf_match.group(0) if hf_match else '<headerFooter><oddHeader>&amp;R&amp;"-,Bold"_x000a_Bill No. SBSKK /EXAM/ ............... / ......</oddHeader><oddFooter>&amp;L                   Stamp                                  This is a Computer Generated Bill                    _x000a_                            &amp;C_x000a_&amp;RFor Suro Bharati Sangeet Kala Kendra_x000a__x000a_Authorised Signatory </oddFooter><evenHeader /><evenFooter /><firstHeader /><firstFooter /></headerFooter>'

print('Read template parts successfully!')
print('Media size:', len(orig_media) if orig_media else 0)
print('Drawing size:', len(orig_drawing) if orig_drawing else 0)
print('HF snippet:', orig_hf[:60])
