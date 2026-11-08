Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_yoga_current.xlsx")
    $ws = $wb.Sheets.Item(1)
    
    # 200% Zoom = 2x resolution = razor sharp!
    $excel.ActiveWindow.Zoom = 200
    
    $range = $ws.Range("A9:F22")
    $range.CopyPicture(1, 2)
    
    Start-Sleep -Milliseconds 300
    
    if ([System.Windows.Forms.Clipboard]::ContainsImage()) {
        $img = [System.Windows.Forms.Clipboard]::GetImage()
        $w = $img.Width
        $h = $img.Height
        $img.Save("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\direct_clip.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "Success! Direct clipboard image saved! Width: $w Height: $h"
    } else {
        Write-Host "Clipboard does not contain image"
    }
    
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
