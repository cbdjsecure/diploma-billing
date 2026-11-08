Add-Type -AssemblyName System.Drawing

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_yoga_current.xlsx")
    $ws = $wb.Sheets.Item(1)
    
    $range = $ws.Range("A9:F22")
    
    # In Excel, we can set ScreenUpdating = $false
    # We can temporarily increase Font or Zoom
    # Let us test adding chart with exact width and height:
    # Notice: at 100% zoom, what if we use CopyPicture(1, 2)?
    # Wait, can we resize the chart object to the pasted picture size?
    
    $excel.ActiveWindow.Zoom = 200
    $range.CopyPicture(1, 2)
    
    $chartObj = $ws.ChartObjects().Add(0, 0, $range.Width, $range.Height)
    $chart = $chartObj.Chart
    $chart.ChartArea.Format.Line.Visible = 0
    $chart.Paste()
    
    # Check pasted picture shape
    if ($chart.Shapes.Count -gt 0) {
        $shape = $chart.Shapes.Item(1)
        Write-Host "Shape Width:" $shape.Width "Height:" $shape.Height
        $chartObj.Width = $shape.Width
        $chartObj.Height = $shape.Height
    }
    
    $chart.Export("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_tight.png", "PNG")
    $chartObj.Delete()
    
    $wb.Close($false)
    Write-Host "Exported tight!"
} catch {
    Write-Host "Error:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
