$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open((Resolve-Path "data/test_injected.xlsx").Path)
    Write-Host "SUCCESS OPENING test_injected.xlsx"
    $ws = $wb.Sheets.Item(1)
    Write-Host "Shapes count: $($ws.Shapes.Count)"
    if ($ws.Shapes.Count -gt 0) {
        Write-Host "Shape 1 name: $($ws.Shapes.Item(1).Name)"
    }
    Write-Host "Header RightHeader: $($ws.PageSetup.RightHeader)"
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
