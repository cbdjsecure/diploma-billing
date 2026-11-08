Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open((Resolve-Path "data/test_rich_template.xlsx").Path)
    $ws = $wb.Sheets.Item(1)
    $range = $ws.Range("A1:F10")
    $range.CopyPicture([Microsoft.Office.Interop.Excel.XlPictureAppearance]::xlScreen, [Microsoft.Office.Interop.Excel.XlCopyPictureFormat]::xlBitmap)
    $img = [System.Windows.Forms.Clipboard]::GetImage()
    if ($img -ne $null) {
        $img.Save("data/test_rich_rendered.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "SUCCESS: Saved data/test_rich_rendered.png"
    }
    $wb.Close($false)
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
