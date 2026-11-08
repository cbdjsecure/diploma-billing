Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open("C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_yoga_current.xlsx")
    $ws = $wb.Sheets.Item(1)
    
    $range = $ws.Range("A9:F22")
    $range.CopyPicture(1, -4147)
    
    Start-Sleep -Milliseconds 300
    
    $dataObj = [System.Windows.Forms.Clipboard]::GetDataObject()
    $meta = $dataObj.GetData([System.Windows.Forms.DataFormats]::EnhancedMetafile)
    Write-Host "Meta type:" $meta.GetType().FullName
    
    $wb.Close($false)
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
