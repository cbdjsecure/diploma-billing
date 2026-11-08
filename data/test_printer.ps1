Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_yoga_current.xlsx")
    $ws = $wb.Sheets.Item(1)
    
    $range = $ws.Range("A9:F22")
    # xlPrinter = 2, xlPicture = -4147 (Vector/EMF printer format - maximum crisp quality!)
    $range.CopyPicture(2, -4147)
    
    Start-Sleep -Milliseconds 300
    
    if ([System.Windows.Forms.Clipboard]::ContainsImage()) {
        $img = [System.Windows.Forms.Clipboard]::GetImage()
        $w = $img.Width
        $h = $img.Height
        $img.Save("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\printer_clip.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Write-Host "Success! Printer quality image saved! Width: $w Height: $h"
    } else {
        Write-Host "Clipboard does not contain image"
    }
    
    $wb.Close($false)
} catch {
    Write-Host "Error:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
