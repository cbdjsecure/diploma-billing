$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open((Resolve-Path "data/test_neg_ex.xlsx").Path)
    $ws = $wb.Sheets.Item(1)
    Write-Host "Excel calculated values:"
    Write-Host "Fees After Deduction (E16):" $ws.Range("E16").Text
    Write-Host "Reg Fees (E17):" $ws.Range("E17").Text
    Write-Host "Convo Fees (E18):" $ws.Range("E18").Text
    Write-Host "Examiner Fees (E19):" $ws.Range("E19").Text
    Write-Host "Total Payable (E20):" $ws.Range("E20").Text
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
