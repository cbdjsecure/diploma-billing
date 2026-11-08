Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open((Resolve-Path "data/test_b4_injected.xlsx").Path)
    $ws = $wb.Sheets.Item(1)
    Write-Host "Shapes count:" $ws.Shapes.Count
    Write-Host "Header oddHeader:" $ws.PageSetup.RightHeader
    $range = $ws.Range("A1:F10")
    $range.CopyPicture([Microsoft.Office.Interop.Excel.XlPictureAppearance]::xlScreen, [Microsoft.Office.Interop.Excel.XlCopyPictureFormat]::xlBitmap)
    $img = [System.Windows.Forms.Clipboard]::GetImage()
    if ($img -ne $null) {
        $img.Save("data/test_top_rendered.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "Saved data/test_top_rendered.png"
    } else {
        Write-Host "Clipboard empty"
    }
    $wb.Close($false)
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
