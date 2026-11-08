Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open((Resolve-Path "data/test_full_output.xlsx").Path)
    Write-Host "SUCCESS OPENING test_full_output.xlsx"
    $ws = $wb.Sheets.Item(1)
    Write-Host "Shapes count: $($ws.Shapes.Count)"
    if ($ws.Shapes.Count -gt 0) {
        Write-Host "Shape 1 Name: $($ws.Shapes.Item(1).Name)"
    }
    Write-Host "RightHeader:`n$($ws.PageSetup.RightHeader)"
    Write-Host "B4 value: $($ws.Range('B4').Text)"
    Write-Host "A14 (Churamoni) value: $($ws.Range('A14').Text)"
    Write-Host "A14 row height: $($ws.Range('A14').RowHeight)"

    # Capture whole bill to PNG
    $lastRow = 17
    $range = $ws.Range("A1:F$lastRow")
    $range.CopyPicture([Microsoft.Office.Interop.Excel.XlPictureAppearance]::xlScreen, [Microsoft.Office.Interop.Excel.XlCopyPictureFormat]::xlBitmap)
    $img = [System.Windows.Forms.Clipboard]::GetImage()
    if ($img -ne $null) {
        $img.Save("data/test_full_rendered.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "Saved data/test_full_rendered.png"
    }
    $wb.Close($false)
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
