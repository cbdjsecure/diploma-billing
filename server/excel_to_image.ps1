param (
    [string]$xlsxPath,
    [string]$outImgPath
)
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $wb = $excel.Workbooks.Open($xlsxPath)
    $ws = $wb.Sheets.Item(1)
    
    # 1. Detect right-side last active column (from col 15 backwards to col 1)
    $lastCol = 5
    for ($c = 15; $c -ge 1; $c--) {
        for ($r = 9; $r -le 50; $r++) {
            $v = $ws.Cells.Item($r, $c).Value()
            if ($v -ne $null -and "$v".Trim() -ne "") {
                if ($c -gt $lastCol) {
                    $lastCol = $c
                }
                break
            }
        }
    }

    # 2. Detect down-side last active row (from row 50 backwards to row 9)
    $lastRow = 18
    for ($r = 50; $r -ge 9; $r--) {
        $hasVal = $false
        for ($c = 1; $c -le $lastCol; $c++) {
            $v = $ws.Cells.Item($r, $c).Value()
            if ($v -ne $null -and "$v".Trim() -ne "") {
                $hasVal = $true
                break
            }
        }
        if ($hasVal) {
            $lastRow = $r
            break
        }
    }

    # 3. Dynamic Range from cell A9 (1,9) to right-side last column and bottom-side last row
    $startCell = $ws.Cells.Item(9, 1) # A9
    $endCell = $ws.Cells.Item($lastRow, $lastCol)
    $range = $ws.Range($startCell, $endCell)
    # xlScreen = 1, xlBitmap = 2
    $range.CopyPicture(1, 2)
    
    $chartObj = $ws.ChartObjects().Add(0, 0, $range.Width, $range.Height)
    $chart = $chartObj.Chart
    $chartObj.Activate()
    $chart.Paste()
    $chart.Export($outImgPath, "PNG")
    $chartObj.Delete()
    
    $wb.Close($false)
    Write-Output "OK:$lastRow"
} catch {
    Write-Error $_.Exception.Message
    exit 1
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
