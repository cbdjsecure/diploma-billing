Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

function Capture-Top($xlsxPath, $outPng) {
    $wb = $excel.Workbooks.Open((Resolve-Path $xlsxPath).Path)
    $ws = $wb.Sheets.Item(1)
    $range = $ws.Range("A1:F10")
    $range.CopyPicture([Microsoft.Office.Interop.Excel.XlPictureAppearance]::xlScreen, [Microsoft.Office.Interop.Excel.XlCopyPictureFormat]::xlBitmap)
    $img = [System.Windows.Forms.Clipboard]::GetImage()
    if ($img -ne $null) {
        $img.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
    }
    $wb.Close($false)
}

Capture-Top "C:\Users\SASWATA\.gemini\antigravity\brain\feb72794-f641-45b4-8b93-81b9308c82a3\.user_uploaded\media_1794145659400_b7dbcb90.xlsx" "data/top_1111.png"
Capture-Top "data/temp_bill_13.xlsx" "data/top_temp13.png"

$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host "Captured top images"
