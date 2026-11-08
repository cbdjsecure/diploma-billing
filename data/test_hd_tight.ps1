Add-Type -AssemblyName System.Drawing

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $true
$excel.WindowState = -4140 # Minimized so it doesn't disturb the user!
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_yoga_current.xlsx")
    $ws = $wb.Sheets.Item(1)
    
    # Set 200% Zoom for Ultra-High Resolution!
    $excel.ActiveWindow.Zoom = 200
    
    $range = $ws.Range("A9:F22")
    $range.CopyPicture(1, 2)
    
    # Add chart
    $chartObj = $ws.ChartObjects().Add(0, 0, $range.Width * 3, $range.Height * 3)
    $chart = $chartObj.Chart
    $chart.ChartArea.Format.Line.Visible = 0
    $chart.Paste()
    
    # Fit chart object perfectly to the high-res pasted shape!
    if ($chart.Shapes.Count -gt 0) {
        $shape = $chart.Shapes.Item(1)
        $chartObj.Width = $shape.Width
        $chartObj.Height = $shape.Height
    }
    
    $chart.Export("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_hd_tight.png", "PNG")
    $chartObj.Delete()
    
    $wb.Close($false)
    Write-Host "Success HD Tight!"
} catch {
    Write-Host "Error:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
