Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\brain\feb72794-f641-45b4-8b93-81b9308c82a3\.user_uploaded\media_1794145659400_b7dbcb90.xlsx")
    $ws = $wb.Sheets.Item(1)
    $range = $ws.Range("B4:E5")
    $range.CopyPicture([Microsoft.Office.Interop.Excel.XlPictureAppearance]::xlScreen, [Microsoft.Office.Interop.Excel.XlCopyPictureFormat]::xlBitmap)
    $img = [System.Windows.Forms.Clipboard]::GetImage()
    if ($img -ne $null) {
        $img.Save("data/1111_b4.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "SUCCESS: Saved data/1111_b4.png"
    }
    $wb.Close($false)
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
