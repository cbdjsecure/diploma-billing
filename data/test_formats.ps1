Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_yoga_current.xlsx")
    $ws = $wb.Sheets.Item(1)
    
    $range = $ws.Range("A9:F22")
    # xlScreen = 1, xlPicture = -4147 (Vector EMF!)
    $range.CopyPicture(1, -4147)
    
    Start-Sleep -Milliseconds 300
    
    $dataObj = [System.Windows.Forms.Clipboard]::GetDataObject()
    Write-Host "Formats on clipboard:" ($dataObj.GetFormats() -join ", ")
    
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
