import zipfile, re, os

template_path = r'data\test_out.xlsx'
input_xlsx = r'data\test_b4_preview.xlsx'
output_xlsx = r'data\test_b4_injected.xlsx'

with zipfile.ZipFile(template_path, 'r') as z_tmpl:
    orig_media = z_tmpl.read('xl/media/image1.png') if 'xl/media/image1.png' in z_tmpl.namelist() else None
    orig_drawing = z_tmpl.read('xl/drawings/drawing1.xml') if 'xl/drawings/drawing1.xml' in z_tmpl.namelist() else None
    orig_draw_rels = z_tmpl.read('xl/drawings/_rels/drawing1.xml.rels') if 'xl/drawings/_rels/drawing1.xml.rels' in z_tmpl.namelist() else None
    orig_sheet_rels = z_tmpl.read('xl/worksheets/_rels/sheet1.xml.rels') if 'xl/worksheets/_rels/sheet1.xml.rels' in z_tmpl.namelist() else None
    orig_sheet1_xml = z_tmpl.read('xl/worksheets/sheet1.xml').decode('utf-8')
    hf_match = re.search(r'<headerFooter.*?</headerFooter>', orig_sheet1_xml, re.DOTALL)
    orig_hf = hf_match.group(0) if hf_match else '<headerFooter><oddHeader>&amp;R\r\n&amp;"-,Bold"Bill No. SBSKK /EXAM/ ............... / ......</oddHeader><oddFooter xml:space="preserve">&amp;L                   Stamp                                  This is a Computer Generated Bill                    \r\n                            &amp;C\r\n&amp;RFor Suro Bharati Sangeet Kala Kendra\r\n\r\nAuthorised Signatory </oddFooter></headerFooter>'

drawing_tag = '<drawing xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1" />'

with zipfile.ZipFile(input_xlsx, 'r') as zin, zipfile.ZipFile(output_xlsx, 'w', zipfile.ZIP_DEFLATED) as zout:
    has_media = False
    has_drawing = False
    has_draw_rels = False
    has_sheet_rels = False

    for item in zin.infolist():
        fname = item.filename
        content = zin.read(fname)

        if 'externalLink' in fname:
            continue

        if fname == 'xl/workbook.xml':
            text = content.decode('utf-8')
            text = re.sub(r'<externalReferences>.*?</externalReferences>', '', text)
            content = text.encode('utf-8')

        elif fname == 'xl/_rels/workbook.xml.rels':
            text = content.decode('utf-8')
            text = re.sub(r'<Relationship[^>]*Target="externalLinks/[^>]*/>', '', text)
            content = text.encode('utf-8')

        elif fname == '[Content_Types].xml':
            text = content.decode('utf-8')
            text = re.sub(r'<Override[^>]*externalLink[^>]*/>', '', text)
            if 'image/png' not in text:
                text = text.replace('</Types>', '<Default Extension="png" ContentType="image/png" /></Types>')
            if 'drawing1.xml' not in text:
                text = text.replace('</Types>', '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml" /></Types>')
            content = text.encode('utf-8')

        elif fname == 'xl/worksheets/sheet1.xml':
            text = content.decode('utf-8')
            text = re.sub(r'<headerFooter.*?</headerFooter>', '', text, flags=re.DOTALL)
            text = re.sub(r'<drawing[^>]*/>', '', text)
            
            insert_block = orig_hf + drawing_tag
            text = text.replace('</worksheet>', insert_block + '</worksheet>')
            content = text.encode('utf-8')

        elif fname == 'xl/media/image1.png':
            has_media = True
            if orig_media: content = orig_media
        elif fname == 'xl/drawings/drawing1.xml':
            has_drawing = True
            if orig_drawing: content = orig_drawing
        elif fname == 'xl/drawings/_rels/drawing1.xml.rels':
            has_draw_rels = True
            if orig_draw_rels: content = orig_draw_rels
        elif fname == 'xl/worksheets/_rels/sheet1.xml.rels':
            has_sheet_rels = True
            if orig_sheet_rels: content = orig_sheet_rels

        zout.writestr(fname, content)

    if not has_media and orig_media:
        zout.writestr('xl/media/image1.png', orig_media)
    if not has_drawing and orig_drawing:
        zout.writestr('xl/drawings/drawing1.xml', orig_drawing)
    if not has_draw_rels and orig_draw_rels:
        zout.writestr('xl/drawings/_rels/drawing1.xml.rels', orig_draw_rels)
    if not has_sheet_rels and orig_sheet_rels:
        zout.writestr('xl/worksheets/_rels/sheet1.xml.rels', orig_sheet_rels)

print('Injected test_b4_injected.xlsx successfully')

