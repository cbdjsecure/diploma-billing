import sys
import json
import os
import re
import zipfile
import subprocess
import base64
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
try:
    from openpyxl.cell.rich_text import TextBlock, CellRichText
    from openpyxl.cell.text import InlineFont
    HAS_RICH_TEXT = True
except (ImportError, AttributeError):
    HAS_RICH_TEXT = False

def sanitize_xlsx(xlsx_path, template_path):
    r"""
    Ensures exported xlsx opens cleanly in Excel without any 'Repair' or 'Do you want to recover' warning:
    1. Strips any external formula references (e.g. legacy D:\Centre Backup.xlsx).
    2. Restores pristine Kendra logo (xl/media/image1.png), drawing shapes, rels, and [Content_Types].
    3. Re-injects the custom bold header ('Bill No. SBSKK /EXAM/ ............... / ......')
       and computer-generated bill stamp footer (<headerFooter>).
    """
    orig_media = None
    orig_drawing = None
    orig_draw_rels = None
    orig_sheet_rels = None
    orig_hf = None

    # Search for template assets in template_path or fallbacks
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidate_templates = [
        template_path,
        os.path.join(script_dir, '../template.xlsx'),
        os.path.join(script_dir, '../../data/test_out.xlsx')
    ]

    for tmpl in candidate_templates:
        if tmpl and os.path.exists(tmpl):
            try:
                with zipfile.ZipFile(tmpl, 'r') as z_tmpl:
                    names = z_tmpl.namelist()
                    if not orig_media and 'xl/media/image1.png' in names:
                        orig_media = z_tmpl.read('xl/media/image1.png')
                    if not orig_drawing and 'xl/drawings/drawing1.xml' in names:
                        orig_drawing = z_tmpl.read('xl/drawings/drawing1.xml')
                    if not orig_draw_rels and 'xl/drawings/_rels/drawing1.xml.rels' in names:
                        orig_draw_rels = z_tmpl.read('xl/drawings/_rels/drawing1.xml.rels')
                    if not orig_sheet_rels and 'xl/worksheets/_rels/sheet1.xml.rels' in names:
                        orig_sheet_rels = z_tmpl.read('xl/worksheets/_rels/sheet1.xml.rels')
                    if not orig_hf and 'xl/worksheets/sheet1.xml' in names:
                        s1_text = z_tmpl.read('xl/worksheets/sheet1.xml').decode('utf-8')
                        m = re.search(r'<headerFooter.*?</headerFooter>', s1_text, re.DOTALL)
                        if m:
                            orig_hf = m.group(0)
            except Exception:
                pass

    if not orig_hf:
        orig_hf = '<headerFooter><oddHeader>&amp;R\r\n&amp;"-,Bold"Bill No. SBSKK /EXAM/ ............... / ......</oddHeader><oddFooter xml:space="preserve">&amp;L                   Stamp                                  This is a Computer Generated Bill                    \r\n                            &amp;C\r\n&amp;RFor Suro Bharati Sangeet Kala Kendra\r\n\r\nAuthorised Signatory </oddFooter></headerFooter>'

    if not orig_sheet_rels:
        orig_sheet_rels = b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="/xl/drawings/drawing1.xml" Id="rId1" /></Relationships>'

    if not orig_draw_rels:
        orig_draw_rels = b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/xl/media/image1.png" Id="rId1" /></Relationships>'

    drawing_tag = '<drawing xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1" />'

    temp_fixed = xlsx_path + '.clean.tmp'
    with zipfile.ZipFile(xlsx_path, 'r') as zin, zipfile.ZipFile(temp_fixed, 'w', zipfile.ZIP_DEFLATED) as zout:
        has_media = False
        has_drawing = False
        has_draw_rels = False
        has_sheet_rels = False

        for item in zin.infolist():
            fname = item.filename
            content = zin.read(fname)

            # Skip externalLinks parts
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
                if orig_media:
                    content = orig_media
            elif fname == 'xl/drawings/drawing1.xml':
                has_drawing = True
                if orig_drawing:
                    content = orig_drawing
            elif fname == 'xl/drawings/_rels/drawing1.xml.rels':
                has_draw_rels = True
                if orig_draw_rels:
                    content = orig_draw_rels
            elif fname == 'xl/worksheets/_rels/sheet1.xml.rels':
                has_sheet_rels = True
                if orig_sheet_rels:
                    content = orig_sheet_rels

            zout.writestr(fname, content)

        if not has_media and orig_media:
            zout.writestr('xl/media/image1.png', orig_media)
        if not has_drawing and orig_drawing:
            zout.writestr('xl/drawings/drawing1.xml', orig_drawing)
        if not has_draw_rels and orig_draw_rels:
            zout.writestr('xl/drawings/_rels/drawing1.xml.rels', orig_draw_rels)
        if not has_sheet_rels and orig_sheet_rels:
            zout.writestr('xl/worksheets/_rels/sheet1.xml.rels', orig_sheet_rels)

    os.replace(temp_fixed, xlsx_path)

def get_slab_name(examinee_count, discount_slabs):
    """Determine the standard slab label e.g. '36-99', '15-35', '0-14'"""
    if examinee_count < 15:
        return '0-14'
    for s in discount_slabs:
        min_c = s.get('min_count') or 0
        max_c = s.get('max_count')
        if max_c is not None:
            if min_c <= examinee_count <= max_c:
                return f"{min_c}-{max_c}"
        else:
            if examinee_count >= min_c:
                return f"{min_c}+"
    return '15-35'

def populate_single_worksheet(ws, bill_meta, disc_key, items, zone, total_pct, slab_pct, extra_pct, seasonal_pct, examiner_amount, examiner_note):
    empty_border = Border(top=Side(style=None), bottom=Side(style=None), left=Side(style=None), right=Side(style=None))
    no_fill = PatternFill(fill_type=None)

    font_normal = Font(name="Century Schoolbook", size=12, bold=False)
    font_churamoni = Font(name="Century Schoolbook", size=10.5, bold=False)
    font_bold_11 = Font(name="Century Schoolbook", size=11, bold=True)
    font_bold_12 = Font(name="Century Schoolbook", size=12, bold=True)
    font_bold_13 = Font(name="Century Schoolbook", size=13, bold=True)
    font_bold_14 = Font(name="Century Schoolbook", size=14, bold=True)
    font_bold_15 = Font(name="Century Schoolbook", size=15, bold=True)
    font_bold_18 = Font(name="Century Schoolbook", size=18, bold=True)

    # 1. Cleanly unmerge ALL existing ranges from Row 10 downwards to prevent overlap/corruption
    to_unmerge = [m.coord for m in list(ws.merged_cells.ranges) if m.max_row >= 10]
    for coord in to_unmerge:
        ws.unmerge_cells(coord)

    # 2. Clear table and calculation rows (Row 10 to 45) so no stale data or gap rows remain
    for r in range(10, 46):
        for c in range(1, 6):
            cell = ws.cell(r, c)
            cell.value = None
            cell.fill = no_fill
            cell.border = empty_border
        if r > 10:
            ws.cell(r, 6).value = None

    # 3. Top Header Merges & Metadata
    ranges_set = set(str(m) for m in ws.merged_cells.ranges)
    for r_coord in ['A2:A5', 'B2:E3', 'B4:E5', 'B6:E6', 'B7:E7', 'B8:E8']:
        if r_coord not in ranges_set:
            try:
                ws.merge_cells(r_coord)
            except Exception:
                pass

    ws['B2'] = 'Suro Bharati Sangeet Kala Kendra'
    ws['B2'].font = font_bold_18
    ws['B2'].alignment = Alignment(horizontal='center', vertical='center')

    session_val = str(bill_meta.get('session') or '26-27').strip()
    session_full = session_val if session_val.startswith('20') else f"20{session_val}"
    
    # Address is size 10; Session is size 14 with bold and underline
    if HAS_RICH_TEXT:
        try:
            font_addr = InlineFont(rFont="Century Schoolbook", sz=10, b=True)
            font_sess = InlineFont(rFont="Century Schoolbook", sz=14, b=True, u="single")
            ws['B4'] = CellRichText([
                TextBlock(font_addr, "19/I Vivekananda Lane , Serampore , Hooghly - 712201\n"),
                TextBlock(font_sess, f"Session {session_full}")
            ])
        except Exception:
            ws['B4'].value = f"19/I Vivekananda Lane , Serampore , Hooghly - 712201\nSession {session_full}"
            ws['B4'].font = Font(name="Century Schoolbook", size=11, bold=True)
    else:
        ws['B4'].value = f"19/I Vivekananda Lane , Serampore , Hooghly - 712201\nSession {session_full}"
        ws['B4'].font = Font(name="Century Schoolbook", size=11, bold=True)
    ws['B4'].alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

    ws['A6'] = 'Name of Institute - '
    ws['A6'].font = font_bold_12
    ws['A6'].alignment = Alignment(vertical='center')
    ws['B6'] = bill_meta.get('centre_name') or ''
    ws['B6'].font = font_bold_12
    ws['B6'].alignment = Alignment(horizontal='left', vertical='center')

    ws['A7'] = 'Principal - '
    ws['A7'].font = font_bold_12
    ws['A7'].alignment = Alignment(vertical='center')
    ws['B7'] = bill_meta.get('principal') or ''
    ws['B7'].font = font_bold_12
    ws['B7'].alignment = Alignment(horizontal='left', vertical='center')

    ws['A8'] = 'Address - '
    ws['A8'].font = font_bold_12
    ws['A8'].alignment = Alignment(vertical='center')
    addr = bill_meta.get('address') or ''
    phone = bill_meta.get('phone') or ''
    if phone:
        addr = f"{addr} (Ph: {phone})"
    ws['B8'] = addr
    ws['B8'].font = font_bold_12
    ws['B8'].alignment = Alignment(horizontal='left', vertical='center')

    short_code = str(bill_meta.get('centre_short_code') or '').strip()

    ws['F5'] = 'Short Code'
    ws['F5'].font = Font(name="Century Schoolbook", size=12, bold=False)
    ws['F5'].alignment = Alignment(horizontal='center', vertical='center')

    ws['F6'] = short_code
    ws['F6'].font = font_bold_14
    ws['F6'].alignment = Alignment(horizontal='center', vertical='center')

    ws['A9'] = 'Year'
    ws['A9'].font = font_bold_12
    ws['A9'].alignment = Alignment(horizontal='center', vertical='center')

    ws['B9'] = 'Exam Fees'
    ws['B9'].font = font_bold_12
    ws['B9'].alignment = Alignment(horizontal='center', vertical='center')

    ws['C9'] = 'Old Examinee '
    ws['C9'].font = font_bold_12
    ws['C9'].alignment = Alignment(horizontal='center', vertical='center')

    ws['D9'] = 'New Examinee'
    ws['D9'].font = font_bold_12
    ws['D9'].alignment = Alignment(horizontal='center', vertical='center')

    ws['E9'] = 'Total Amount'
    ws['E9'].font = font_bold_12
    ws['E9'].alignment = Alignment(horizontal='center', vertical='center')

    ws['F9'] = 'Session'
    ws['F9'].font = font_bold_15
    ws['F9'].alignment = Alignment(horizontal='center', vertical='center')

    ws['F10'] = session_val
    ws['F10'].font = font_bold_15
    ws['F10'].alignment = Alignment(horizontal='center', vertical='center')

    # Row heights & column widths matching original template specifications
    ws.row_dimensions[1].height = 21.75
    ws.row_dimensions[2].height = 12.75
    ws.row_dimensions[3].height = 24.0
    ws.row_dimensions[4].height = 15.0
    ws.row_dimensions[5].height = 27.0
    ws.row_dimensions[6].height = 24.0
    ws.row_dimensions[7].height = 25.5
    ws.row_dimensions[8].height = 25.5
    ws.row_dimensions[9].height = 30.0

    ws.column_dimensions['F'].width = 11.5
    ws.column_dimensions['A'].width = 22.109375

    # 4. Populate exam level items starting strictly at Row 10
    num_items = len(items)
    conv_parts = []

    # Convocation fees is NOT applicable to West Bengal zone (except Kolkata zone) and semester yoga bills
    is_wb_non_kolkata = (
        zone == 'zone1_ne_wb' or 
        'zone1' in str(zone).lower() or 
        ('west bengal' in str(zone).lower() and 'kolkata' not in str(zone).lower()) or
        ('wb' in str(zone).lower() and 'kolkata' not in str(zone).lower())
    )
    is_yoga = (disc_key == 'yoga' or zone == 'yoga' or 'yoga' in str(bill_meta.get('category', '')).lower())

    total_examinees_disc = sum((int(it.get('old_count') or 0) + int(it.get('new_count') or 0)) for it in items)

    churamoni_row = None
    for idx, item in enumerate(items):
        row_num = 10 + idx
        c1 = ws.cell(row_num, 1)
        raw_name = str(item.get('level_name') or '')
        c2 = ws.cell(row_num, 2)
        if 'Churamoni' in raw_name:
            churamoni_row = row_num
            c1.value = 'All India Churamoni\nExamination'
            ws.row_dimensions[row_num].height = 33.6
            is_zone2 = ('other' in str(zone).lower() or 'zone2' in str(zone).lower())
            churamoni_rate = (2600 if is_zone2 else 2200) if total_examinees_disc < 15 else (1900 if is_zone2 else 1600)
            c2.value = float(churamoni_rate)
        else:
            c1.value = raw_name
            c2.value = float(item['exam_fee'])
        c1.font = font_normal
        c1.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

        c2.font = font_normal
        c2.alignment = Alignment(horizontal='center', vertical='center')

        c3 = ws.cell(row_num, 3)
        c3.value = int(item.get('old_count') or 0)
        c3.font = font_normal
        c3.alignment = Alignment(horizontal='center', vertical='center')

        c4 = ws.cell(row_num, 4)
        c4.value = int(item.get('new_count') or 0)
        c4.font = font_normal
        c4.alignment = Alignment(horizontal='center', vertical='center')

        c5 = ws.cell(row_num, 5)
        c5.value = f'=SUM(B{row_num}*C{row_num})+(B{row_num}*D{row_num})'
        c5.font = font_normal
        c5.alignment = Alignment(horizontal='center', vertical='center')

        conv_fee = float(item.get('convocation_fee') or 0)
        if conv_fee > 0 and not is_wb_non_kolkata and not is_yoga:
            conv_parts.append(f'(C{row_num}*{int(conv_fee)})+(D{row_num}*{int(conv_fee)})')

    last_item_row = 10 + num_items - 1
    total_row = 10 + num_items  # Immediately follows last item: Yoga=18, Western=19, Indian=22

    # 5. Row Total-- (immediately under the items, NO blank rows!)
    ws.cell(total_row, 1).value = 'Total--'
    ws.cell(total_row, 1).font = font_bold_12
    ws.cell(total_row, 1).alignment = Alignment(horizontal='right', vertical='center')
    ws.merge_cells(f'A{total_row}:B{total_row}')

    ws.cell(total_row, 3).value = f'=SUM(C10:C{last_item_row})'
    ws.cell(total_row, 3).font = font_normal
    ws.cell(total_row, 3).alignment = Alignment(horizontal='center', vertical='center')

    ws.cell(total_row, 4).value = f'=SUM(D10:D{last_item_row})'
    ws.cell(total_row, 4).font = font_normal
    ws.cell(total_row, 4).alignment = Alignment(horizontal='center', vertical='center')

    ws.cell(total_row, 5).value = f'=SUM(E10:E{last_item_row})'
    ws.cell(total_row, 5).font = font_normal
    ws.cell(total_row, 5).alignment = Alignment(horizontal='center', vertical='center')
    ws.cell(total_row, 5).number_format = '0'

    has_discount = (total_pct > 0)
    has_convo = (not is_wb_non_kolkata and not is_yoga and bool(conv_parts))

    curr_row = total_row
    ded_row = None
    disc_row = None
    conv_row = None
    ex_row = None

    # Percentage row and fees after deduction should only be added where percentage is there
    if has_discount:
        disc_row = curr_row + 1
        curr_row = disc_row
        disc_text = f'Special Less {int(slab_pct)}%'
        extra_combined = extra_pct + seasonal_pct
        if extra_combined > 0:
            disc_text += f' + Extra Less {int(extra_combined)}%'

        ws.cell(disc_row, 1).value = disc_text
        ws.cell(disc_row, 1).font = font_bold_11
        ws.cell(disc_row, 1).alignment = Alignment(horizontal='center', vertical='center')
        ws.merge_cells(f'A{disc_row}:D{disc_row}')

        pct_factor = round(total_pct / 100.0, 4)
        # ONLY for Indian bills percentage will exclude All India Churamoni Examination: =(E{total_row}-E{churamoni_row})*percentage
        # Uses Excel decrease decimal / round off feature (>= .5 rounds up, < .5 remains integer)
        if disc_key == 'indian' and churamoni_row:
            ws.cell(disc_row, 5).value = f'=ROUND((E{total_row}-E{churamoni_row})*{pct_factor},0)'
        else:
            ws.cell(disc_row, 5).value = f'=ROUND(E{total_row}*{pct_factor},0)'
        ws.cell(disc_row, 5).font = font_bold_11
        ws.cell(disc_row, 5).alignment = Alignment(horizontal='center', vertical='center')
        ws.cell(disc_row, 5).number_format = '0'

        ded_row = curr_row + 1
        curr_row = ded_row
        ws.cell(ded_row, 1).value = 'Fees After Deduction'
        ws.cell(ded_row, 1).font = font_bold_11
        ws.cell(ded_row, 1).alignment = Alignment(horizontal='center', vertical='center')
        ws.merge_cells(f'A{ded_row}:D{ded_row}')

        ws.cell(ded_row, 5).value = f'=ROUND(E{total_row}-E{disc_row},0)'
        ws.cell(ded_row, 5).font = font_bold_11
        ws.cell(ded_row, 5).alignment = Alignment(horizontal='center', vertical='center')
        ws.cell(ded_row, 5).number_format = '0'

    # Registration fees row (Always present)
    reg_row = curr_row + 1
    curr_row = reg_row
    ws.cell(reg_row, 1).value = 'Rs- 23/- Registration Fees (For Each New Examinee)'
    ws.cell(reg_row, 1).font = font_bold_11
    ws.cell(reg_row, 1).alignment = Alignment(horizontal='center', vertical='center')
    ws.merge_cells(f'A{reg_row}:D{reg_row}')

    ws.cell(reg_row, 5).value = f'=SUM(D{total_row}*23)'
    ws.cell(reg_row, 5).font = font_bold_11
    ws.cell(reg_row, 5).alignment = Alignment(horizontal='center', vertical='center')
    ws.cell(reg_row, 5).number_format = '0'

    # Convocation fees row (Not applicable to WB zone except Kolkata zone, and not for semester yoga)
    if has_convo:
        conv_row = curr_row + 1
        curr_row = conv_row
        ws.cell(conv_row, 1).value = 'Convocation Fees'
        ws.cell(conv_row, 1).font = font_bold_11
        ws.cell(conv_row, 1).alignment = Alignment(horizontal='center', vertical='center')
        ws.merge_cells(f'A{conv_row}:D{conv_row}')

        ws.cell(conv_row, 5).value = '=SUM(' + '+'.join(conv_parts) + ')'
        ws.cell(conv_row, 5).font = font_bold_11
        ws.cell(conv_row, 5).alignment = Alignment(horizontal='center', vertical='center')
        ws.cell(conv_row, 5).number_format = '0'

    # Examiner payment row will ONLY be added if there is examiner payment greater than 0
    if examiner_amount > 0:
        ex_row = curr_row + 1
        curr_row = ex_row
        ws.cell(ex_row, 1).value = examiner_note or 'Examiner fees for 2 school'
        ws.cell(ex_row, 1).font = font_bold_12
        ws.cell(ex_row, 1).alignment = Alignment(horizontal='center', vertical='center')
        ws.merge_cells(f'A{ex_row}:D{ex_row}')

        for c in range(1, 6):
            ws.cell(ex_row, c).border = empty_border

        # Examiner fees written as negative amount in column E
        ws.cell(ex_row, 5).value = -(int(examiner_amount) if examiner_amount == int(examiner_amount) else float(examiner_amount))
        ws.cell(ex_row, 5).font = font_normal
        ws.cell(ex_row, 5).alignment = Alignment(horizontal='center', vertical='center')
        ws.cell(ex_row, 5).number_format = '0'

    # Final calculation row:
    # Calculated strictly like: total fees - deduction + reg fees + convo fees + (-examiner fees)
    final_row = curr_row + 1

    if has_discount:
        formula_terms = [f"E{ded_row}", f"+E{reg_row}"]
    else:
        formula_terms = [f"E{total_row}", f"+E{reg_row}"]

    if has_convo:
        formula_terms.append(f"+E{conv_row}")

    if examiner_amount > 0:
        formula_terms.append(f"+E{ex_row}")

    # Minimum Payable Rates when student count < 15
    min_payable_map = {
        'zone1_ne_wb': {'indian': 2000, 'western': 4300, 'yoga': 2500},
        'zone4_kolkata': {'indian': 2000, 'western': 4300, 'yoga': 2500},
        'zone3_central_east': {'indian': 3000, 'western': 5500, 'yoga': 2500},
        'zone2_other': {'indian': 4000, 'western': 6400, 'yoga': 2500},
    }
    norm_zone = 'zone1_ne_wb'
    for zk in ['zone4_kolkata', 'zone3_central_east', 'zone2_other', 'zone1_ne_wb']:
        if zk in str(zone).lower():
            norm_zone = zk
            break
        elif zk == 'zone4_kolkata' and 'kolkata' in str(zone).lower():
            norm_zone = zk
            break
        elif zk == 'zone3_central_east' and ('central' in str(zone).lower() or 'bihar' in str(zone).lower() or 'chhattisgarh' in str(zone).lower()):
            norm_zone = zk
            break
        elif zk == 'zone2_other' and ('other' in str(zone).lower() or 'zone 2' in str(zone).lower()):
            norm_zone = zk
            break

    min_payable = 0
    if total_examinees_disc > 0 and total_examinees_disc < 15:
        min_payable = min_payable_map.get(norm_zone, {}).get(disc_key, 0)

    # Standard formula for Total Payable Exam Fees (no MAX formula, shows what is total payable only)
    sum_formula = "=" + "".join(formula_terms)

    # 6. Final Row: Total Examinee & Total Payable Exam Fees
    # Column A: Label only
    ws.cell(final_row, 1).value = 'Total Examinee--'
    ws.cell(final_row, 1).font = font_bold_12
    ws.cell(final_row, 1).alignment = Alignment(vertical='center')
    ws.cell(final_row, 1).border = Border(top=Side(style='medium'), bottom=Side(style='medium'), left=Side(style='medium'))

    # Column B: Sum of examinees, Align Left
    ws.cell(final_row, 2).value = f'=SUM(C{total_row}+D{total_row})'
    ws.cell(final_row, 2).font = font_bold_13
    ws.cell(final_row, 2).alignment = Alignment(horizontal='left', vertical='center')
    ws.cell(final_row, 2).border = Border(top=Side(style='medium'), bottom=Side(style='medium'), right=Side(style='medium'))

    # Columns C & D: Merged for 'Total Payable Exam Fees--'
    ws.cell(final_row, 3).value = 'Total Payable Exam Fees--'
    ws.cell(final_row, 3).font = font_bold_12
    ws.cell(final_row, 3).alignment = Alignment(horizontal='center', vertical='center')
    ws.cell(final_row, 3).border = Border(top=Side(style='medium'), bottom=Side(style='medium'), left=Side(style='medium'))
    ws.cell(final_row, 4).value = None
    ws.cell(final_row, 4).border = Border(top=Side(style='medium'), bottom=Side(style='medium'))
    ws.merge_cells(f'C{final_row}:D{final_row}')

    # Column E: Final Amount Formula
    ws.cell(final_row, 5).value = sum_formula
    ws.cell(final_row, 5).font = font_bold_14
    ws.cell(final_row, 5).alignment = Alignment(horizontal='center', vertical='center')
    ws.cell(final_row, 5).border = Border(top=Side(style='medium'), bottom=Side(style='medium'), right=Side(style='medium'))
    ws.cell(final_row, 5).number_format = '0'
    ws.cell(final_row, 6).value = None

    # 7. Minimum Payable Row below Final Row when examinees < 15: Merged A to E, font size 16
    if min_payable > 0:
        min_row = final_row + 1
        font_min_payable = Font(name='Calibri', size=16, bold=True)
        ws.cell(min_row, 1).value = f'Minimum Payable - {min_payable}'
        ws.cell(min_row, 1).font = font_min_payable
        ws.cell(min_row, 1).alignment = Alignment(horizontal='center', vertical='center')
        ws.merge_cells(f'A{min_row}:E{min_row}')
        ws.row_dimensions[min_row].height = 28

        box_border_top = Side(style='medium')
        box_border_bottom = Side(style='medium')
        box_border_side = Side(style='medium')
        for c in range(1, 6):
            left_s = box_border_side if c == 1 else None
            right_s = box_border_side if c == 5 else None
            ws.cell(min_row, c).border = Border(top=box_border_top, bottom=box_border_bottom, left=left_s, right=right_s)


def format_centre_caption(code):
    s = str(code or '').strip()
    if not s:
        return 'C-0000'
    if s.upper().startswith('C'):
        return s
    return f'C-{s}'

def run():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print("No input provided")
            sys.exit(1)
        data = json.loads(raw_input)
    except Exception as e:
        print(f"JSON parse error: {e}")
        sys.exit(1)

    action = data.get('action') or 'export'
    bill = data['bill']
    template_path = data['templatePath']
    out_path = data.get('outPath') or ''
    discount_slabs = data.get('discountSlabs') or []

    is_joint = bool(bill.get('is_joint'))
    joint_data_raw = bill.get('joint_data')
    joint_data = None
    if joint_data_raw:
        try:
            joint_data = json.loads(joint_data_raw) if isinstance(joint_data_raw, str) else joint_data_raw
        except Exception:
            joint_data = None

    zone = bill.get('zone') or 'zone1_ne_wb'
    slab_pct = float(bill.get('slab_discount_percent') or 0)
    extra_pct = float(bill.get('extra_less_percent') or 0)
    seasonal_pct = float(bill.get('seasonal_discount_percent') or 0)
    total_pct = float(bill.get('total_discount_percent') or 0)

    # Base caption formatted as C-xxxx
    raw_code = bill.get('centre_code') or bill.get('centre_short_code') or '1011'
    base_caption = format_centre_caption(raw_code)

    # Determine temporary directory for processing
    script_dir = os.path.dirname(os.path.abspath(__file__))
    temp_dir = os.path.dirname(out_path) if out_path else os.path.join(script_dir, '../../data')
    os.makedirs(temp_dir, exist_ok=True)

    if action == 'render_images':
        # =========================================================================
        # RENDER EXCEL WORKBOOK(S) DIRECTLY TO IMAGE FOR WHATSAPP
        # Range A9:E{last_row} captured directly via Excel COM
        # =========================================================================
        tasks = []
        cleanup_xlsx = []

        if is_joint and joint_data and 'disciplines' in joint_data:
            disciplines = joint_data['disciplines']
            for disc_key in ['indian', 'western', 'yoga']:
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
                        continue

                wb = openpyxl.load_workbook(template_path)
                ws = wb.active

                disc_ex_amt = float(disc_info.get('examinerFeeAmount') or disc_info.get('examiner_fee_amount') or disc_info.get('examiner_deduction') or 0)
                ex_schools = disc_info.get('examinerSchoolCount') or disc_info.get('examiner_school_count') or '2'
                disc_ex_note = disc_info.get('examinerFeeNote') or disc_info.get('examiner_fee_note') or (f'Examiner fees for {ex_schools} school' if disc_ex_amt > 0 else '')
                disc_zone = 'yoga' if disc_key == 'yoga' else zone

                populate_single_worksheet(
                    ws, bill, disc_key, disc_items, disc_zone,
                    total_pct, slab_pct, extra_pct, seasonal_pct,
                    disc_ex_amt, disc_ex_note
                )

                disc_label = disc_key.capitalize()
                temp_xlsx = os.path.join(temp_dir, f"render_{bill.get('id', 'live')}_{disc_key}_{os.getpid()}.xlsx")
                temp_png = os.path.join(temp_dir, f"render_{bill.get('id', 'live')}_{disc_key}_{os.getpid()}.png")
                wb.save(temp_xlsx)
                wb.close()
                sanitize_xlsx(temp_xlsx, template_path)
                cleanup_xlsx.append(temp_xlsx)

                tasks.append({
                    'key': disc_key,
                    'label': disc_label,
                    'xlsxPath': temp_xlsx,
                    'outImgPath': temp_png,
                    'caption': f"{base_caption} ({disc_label})",
                    'filename': f"{base_caption} ({disc_label}).png"
                })

        else:
            items = data.get('items') or []
            wb = openpyxl.load_workbook(template_path)
            ws = wb.active

            disc_key = bill.get('category') or 'indian'
            examiner_amount = float(bill.get('examiner_fee_amount') or bill.get('examinerFeeAmount') or bill.get('examiner_deduction') or 0)
            examiner_note = bill.get('examiner_fee_note') or bill.get('examinerFeeNote') or (f'Examiner fees for 2 school' if examiner_amount > 0 else '')

            populate_single_worksheet(
                ws, bill, disc_key, items, zone,
                total_pct, slab_pct, extra_pct, seasonal_pct,
                examiner_amount, examiner_note
            )

            temp_xlsx = os.path.join(temp_dir, f"render_{bill.get('id', 'live')}_single_{os.getpid()}.xlsx")
            temp_png = os.path.join(temp_dir, f"render_{bill.get('id', 'live')}_single_{os.getpid()}.png")
            wb.save(temp_xlsx)
            wb.close()
            sanitize_xlsx(temp_xlsx, template_path)
            cleanup_xlsx.append(temp_xlsx)

            tasks.append({
                'key': disc_key,
                'label': disc_key.capitalize(),
                'xlsxPath': temp_xlsx,
                'outImgPath': temp_png,
                'caption': base_caption,
                'filename': f"{base_caption}.png"
            })

        rendered_images = []
        if sys.platform == 'win32':
            # Run PowerShell batch rendering script on Windows
            ps_script = os.path.join(script_dir, '../render_excel_images.ps1')
            tasks_json_file = os.path.join(temp_dir, f"tasks_{os.getpid()}.json")
            with open(tasks_json_file, 'w', encoding='utf-8') as f:
                json.dump(tasks, f)

            cmd = [
                'powershell.exe',
                '-ExecutionPolicy', 'Bypass',
                '-File', ps_script,
                tasks_json_file
            ]
            proc = subprocess.run(cmd, capture_output=True, text=True)

            if '---RESULT_START---' in proc.stdout:
                json_str = proc.stdout.split('---RESULT_START---')[1].split('---RESULT_END---')[0].strip()
                res_items = json.loads(json_str)
                if isinstance(res_items, dict):
                    res_items = [res_items]

                for item in res_items:
                    matching_task = next((t for t in tasks if t['key'] == item.get('key')), None)
                    rendered_images.append({
                        'key': item.get('key'),
                        'label': item.get('label') or (matching_task['label'] if matching_task else ''),
                        'caption': matching_task['caption'] if matching_task else base_caption,
                        'filename': matching_task['filename'] if matching_task else f"{base_caption}.png",
                        'lastRow': item.get('lastRow'),
                        'base64': item.get('base64')
                    })
            try:
                if os.path.exists(tasks_json_file):
                    os.remove(tasks_json_file)
            except Exception:
                pass
        else:
            # Linux (Docker / Render / Cloud): Use LibreOffice + pdftoppm
            for t in tasks:
                xlsx_path = t['xlsxPath']
                base_name = os.path.splitext(os.path.basename(xlsx_path))[0]
                # 1. Convert xlsx to pdf
                subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', temp_dir, xlsx_path], capture_output=True)
                pdf_path = os.path.join(temp_dir, f"{base_name}.pdf")
                if os.path.exists(pdf_path):
                    # 2. Convert pdf to high-dpi png using pdftoppm
                    png_prefix = os.path.join(temp_dir, f"png_{base_name}")
                    subprocess.run(['pdftoppm', '-png', '-r', '200', pdf_path, png_prefix], capture_output=True)
                    candidate_png = f"{png_prefix}-1.png"
                    if not os.path.exists(candidate_png):
                        candidates = [f for f in os.listdir(temp_dir) if f.startswith(f"png_{base_name}") and f.endswith('.png')]
                        if candidates:
                            candidate_png = os.path.join(temp_dir, candidates[0])

                    if os.path.exists(candidate_png):
                        with open(candidate_png, 'rb') as f_img:
                            b64 = 'data:image/png;base64,' + base64.b64encode(f_img.read()).decode('utf-8')
                        rendered_images.append({
                            'key': t['key'],
                            'label': t['label'],
                            'caption': t['caption'],
                            'filename': t['filename'],
                            'base64': b64
                        })
                        try:
                            os.remove(candidate_png)
                        except Exception:
                            pass
                    try:
                        os.remove(pdf_path)
                    except Exception:
                        pass

        # Cleanup intermediate files
        for p in cleanup_xlsx:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass
        for t in tasks:
            try:
                if os.path.exists(t['outImgPath']):
                    os.remove(t['outImgPath'])
            except Exception:
                pass
        try:
            if os.path.exists(tasks_json_file):
                os.remove(tasks_json_file)
        except Exception:
            pass

        output_payload = {
            'success': True,
            'isJoint': is_joint,
            'baseCaption': base_caption,
            'images': rendered_images
        }
        print(json.dumps(output_payload))
        return

    elif is_joint and joint_data and 'disciplines' in joint_data:
        # =========================================================================
        # JOINT BILL EXPORT: Export files into a ZIP archive
        # Named: {shortCode}.zip
        # Inside files: {slab_name} (INDIAN).xlsx, {slab_name} (WESTERN).xlsx, etc.
        # =========================================================================
        comb_examinees = int(joint_data.get('combined_examinees') or bill.get('total_examinees') or 0)
        slab_name = joint_data.get('slab_name') or get_slab_name(comb_examinees, discount_slabs)
        disciplines = joint_data['disciplines']

        temp_dir = os.path.dirname(out_path)
        generated_files = []

        for disc_key in ['indian', 'western', 'yoga']:
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
                    continue

            wb = openpyxl.load_workbook(template_path)
            ws = wb.active

            disc_ex_amt = float(disc_info.get('examinerFeeAmount') or disc_info.get('examiner_fee_amount') or disc_info.get('examiner_deduction') or 0)
            ex_schools = disc_info.get('examinerSchoolCount') or disc_info.get('examiner_school_count') or '2'
            disc_ex_note = disc_info.get('examinerFeeNote') or disc_info.get('examiner_fee_note') or (f'Examiner fees for {ex_schools} school' if disc_ex_amt > 0 else '')

            disc_zone = 'yoga' if disc_key == 'yoga' else zone

            populate_single_worksheet(
                ws, bill, disc_key, disc_items, disc_zone,
                total_pct, slab_pct, extra_pct, seasonal_pct,
                disc_ex_amt, disc_ex_note
            )

            file_label = disc_key.upper()
            internal_filename = f"{slab_name} ({file_label}).xlsx"
            temp_xlsx_path = os.path.join(temp_dir, f"temp_{bill.get('id')}_{disc_key}.xlsx")
            wb.save(temp_xlsx_path)
            wb.close()
            sanitize_xlsx(temp_xlsx_path, template_path)
            generated_files.append((temp_xlsx_path, internal_filename))

        # Create the ZIP archive
        with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path, arcname in generated_files:
                zipf.write(file_path, arcname)

        # Clean up temporary xlsx files
        for file_path, _ in generated_files:
            try:
                os.remove(file_path)
            except Exception:
                pass

        print('SUCCESS_ZIP')

    else:
        # =========================================================================
        # SINGLE BILL EXPORT: Export single .xlsx workbook directly
        # =========================================================================
        items = data.get('items') or []
        wb = openpyxl.load_workbook(template_path)
        ws = wb.active

        disc_key = bill.get('category') or 'indian'
        examiner_amount = float(bill.get('examiner_fee_amount') or bill.get('examinerFeeAmount') or bill.get('examiner_deduction') or 0)
        examiner_note = bill.get('examiner_fee_note') or bill.get('examinerFeeNote') or (f'Examiner fees for 2 school' if examiner_amount > 0 else '')

        populate_single_worksheet(
            ws, bill, disc_key, items, zone,
            total_pct, slab_pct, extra_pct, seasonal_pct,
            examiner_amount, examiner_note
        )

        wb.save(out_path)
        wb.close()
        sanitize_xlsx(out_path, template_path)
        print('SUCCESS')

if __name__ == '__main__':
    run()
