$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open((Resolve-Path "data/scenario_s1_kolkata_disc_ex.xlsx").Path)
    $ws = $wb.Sheets.Item(1)
    Write-Host "Excel calculated values for Scenario 1:"
    Write-Host "Total Exam Fees (E12):" $ws.Range("E12").Text
    Write-Host "Special Less (E13):" $ws.Range("E13").Text
    Write-Host "Fees After Deduction (E14):" $ws.Range("E14").Text
    Write-Host "Reg Fees (E15):" $ws.Range("E15").Text
    Write-Host "Convo Fees (E16):" $ws.Range("E16").Text
    Write-Host "Examiner Fees (E17):" $ws.Range("E17").Text
    Write-Host "Total Payable (E18):" $ws.Range("E18").Text
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
