Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open((Resolve-Path "data/test_churamoni_ex.xlsx").Path)
    $ws = $wb.Sheets.Item(1)
    Write-Host "Excel calculated values:"
    Write-Host "Total Exam Fees (E14):" $ws.Range("E14").Text
    Write-Host "Churamoni Fees (E13):" $ws.Range("E13").Text
    Write-Host "Special Less 35% (E15):" $ws.Range("E15").Text
    Write-Host "Fees After Deduction (E16):" $ws.Range("E16").Text
    Write-Host "Examiner Fees (E19):" $ws.Range("E19").Text
    Write-Host "Total Payable (E20):" $ws.Range("E20").Text

    $range = $ws.Range("A9:F20")
    $range.CopyPicture([Microsoft.Office.Interop.Excel.XlPictureAppearance]::xlScreen, [Microsoft.Office.Interop.Excel.XlCopyPictureFormat]::xlBitmap)
    $img = [System.Windows.Forms.Clipboard]::GetImage()
    if ($img -ne $null) {
        $img.Save("data/test_churamoni_ex_rendered.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "Saved data/test_churamoni_ex_rendered.png"
    }
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
