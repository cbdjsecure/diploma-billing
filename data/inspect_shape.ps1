$excel = New-Object -ComObject Excel.Application
$excel.Visible = $true
$excel.WindowState = -4140 # Minimized
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_yoga_current.xlsx")
    $ws = $wb.Sheets.Item(1)
    
    $excel.ActiveWindow.Zoom = 200
    $range = $ws.Range("A9:F22")
    $range.CopyPicture(1, 2)
    
    $chartObj = $ws.ChartObjects().Add(0, 0, 800, 600)
    $chart = $chartObj.Chart
    $chart.Paste()
    
    $shape = $chart.Shapes.Item(1)
    Write-Host "Shape Width:" $shape.Width "Height:" $shape.Height "ScaleWidth:" $shape.ScaleWidth
    
    $chartObj.Delete()
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
