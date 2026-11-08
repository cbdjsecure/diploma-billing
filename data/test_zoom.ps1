Add-Type -AssemblyName System.Drawing

$excel = New-Object -ComObject Excel.Application
$excel.Left = -10000
$excel.Top = -10000
$excel.Width = 1920
$excel.Height = 1080
$excel.Visible = $true
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_yoga_current.xlsx")
    $ws = $wb.Sheets.Item(1)
    
    # 200% Zoom for 2x High-DPI sharpness!
    $excel.ActiveWindow.Zoom = 200
    
    $range = $ws.Range("A9:F22")
    $range.CopyPicture(1, 2)
    
    Start-Sleep -Milliseconds 300
    
    $chartObj = $ws.ChartObjects().Add(0, 0, $range.Width * 2, $range.Height * 2)
    $chart = $chartObj.Chart
    # Make chart area background white and borderless
    $chart.PlotArea.Format.Fill.Solid()
    $chart.PlotArea.Format.Fill.ForeColor.RGB = 0xFFFFFF
    $chart.ChartArea.Format.Line.Visible = 0
    
    $chartObj.Activate()
    $chart.Paste()
    
    Start-Sleep -Milliseconds 300
    
    $chart.Export("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_zoom200_offscreen.png", "PNG")
    $chartObj.Delete()
    
    $wb.Close($false)
    Write-Host "Success exporting offscreen zoom 200!"
} catch {
    Write-Host "Error:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
