$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_round_export.xlsx")
$ws = $wb.Sheets.Item(1)

for ($r = 10; $r -le 17; $r++) {
    $a = $ws.Range("A$r").Text
    $e_val = $ws.Range("E$r").Value2
    $e_text = $ws.Range("E$r").Text
    $e_formula = $ws.Range("E$r").Formula
    $fmt = $ws.Range("E$r").NumberFormat
    Write-Output "Row $r | A: '$a' | Formula: '$e_formula' | Value: '$e_val' | Text: '$e_text' | NumFmt: '$fmt'"
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
