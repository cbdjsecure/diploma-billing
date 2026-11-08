param (
    [string]$inputJsonPath
)

if (-not (Test-Path $inputJsonPath)) {
    Write-Error "Input JSON file not found: $inputJsonPath"
    exit 1
}

Add-Type -AssemblyName System.Drawing

function Trim-WhiteBorders {
    param (
        [string]$imagePath
    )
    try {
        $bmp = [System.Drawing.Bitmap]::FromFile($imagePath)
        $w = $bmp.Width
        $h = $bmp.Height
        $threshold = 245

        # 1. Top
        $top = 0
        for ($y = 0; $y -lt $h; $y++) {
            $found = $false
            for ($x = 0; $x -lt $w; $x += 4) {
                $c = $bmp.GetPixel($x, $y)
                if ($c.R -lt $threshold -or $c.G -lt $threshold -or $c.B -lt $threshold) { $found = $true; break }
            }
            if ($found) { $top = $y; break }
        }

        # 2. Bottom
        $bottom = $h - 1
        for ($y = $h - 1; $y -ge 0; $y--) {
            $found = $false
            for ($x = 0; $x -lt $w; $x += 4) {
                $c = $bmp.GetPixel($x, $y)
                if ($c.R -lt $threshold -or $c.G -lt $threshold -or $c.B -lt $threshold) { $found = $true; break }
            }
            if ($found) { $bottom = $y; break }
        }

        # 3. Left
        $left = 0
        for ($x = 0; $x -lt $w; $x++) {
            $found = $false
            for ($y = $top; $y -le $bottom; $y += 4) {
                $c = $bmp.GetPixel($x, $y)
                if ($c.R -lt $threshold -or $c.G -lt $threshold -or $c.B -lt $threshold) { $found = $true; break }
            }
            if ($found) { $left = $x; break }
        }

        # 4. Right
        $right = $w - 1
        for ($x = $w - 1; $x -ge 0; $x--) {
            $found = $false
            for ($y = $top; $y -le $bottom; $y += 4) {
                $c = $bmp.GetPixel($x, $y)
                if ($c.R -lt $threshold -or $c.G -lt $threshold -or $c.B -lt $threshold) { $found = $true; break }
            }
            if ($found) { $right = $x; break }
        }

        $pad = 4
        $cropX = [Math]::Max(0, $left - $pad)
        $cropY = [Math]::Max(0, $top - $pad)
        $cropW = [Math]::Min($w - $cropX, ($right - $left) + ($pad * 2))
        $cropH = [Math]::Min($h - $cropY, ($bottom - $top) + ($pad * 2))

        $rect = [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH)
        $cropped = $bmp.Clone($rect, $bmp.PixelFormat)
        $bmp.Dispose()

        $cropped.Save($imagePath, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropped.Dispose()
    } catch {
        # If trimming fails, keep original
    }
}

$tasks = Get-Content $inputJsonPath -Raw | ConvertFrom-Json

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $true
$excel.WindowState = -4140 # Minimized
$excel.DisplayAlerts = $false

$results = @()

try {
    foreach ($task in $tasks) {
        $xlsxPath = $task.xlsxPath
        $outImgPath = $task.outImgPath
        $key = $task.key
        $label = $task.label
        
        if (-not (Test-Path $xlsxPath)) {
            continue
        }
        
        $wb = $excel.Workbooks.Open($xlsxPath)
        $ws = $wb.Sheets.Item(1)
        
        # 250% High-DPI Zoom ensures Ultra-HD crystal clear text and numbers
        $excel.ActiveWindow.Zoom = 250
        
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
        
        $chartObj = $ws.ChartObjects().Add(0, 0, $range.Width * 2.8, $range.Height * 2.8)
        $chart = $chartObj.Chart
        $chart.PlotArea.Format.Fill.Solid()
        $chart.PlotArea.Format.Fill.ForeColor.RGB = 0xFFFFFF
        $chart.ChartArea.Format.Line.Visible = 0
        $chartObj.Activate()
        $chart.Paste()
        $chart.Export($outImgPath, "PNG")
        $chartObj.Delete()
        
        $wb.Close($false)
        
        # Trim excess white borders so image fits tightly at Ultra-HD
        Trim-WhiteBorders $outImgPath
        
        # Read as base64 so web client can display or copy directly
        $bytes = [System.IO.File]::ReadAllBytes($outImgPath)
        $b64 = [Convert]::ToBase64String($bytes)
        
        $results += [PSCustomObject]@{
            key = $key
            label = $label
            lastRow = $lastRow
            imagePath = $outImgPath
            base64 = "data:image/png;base64,$b64"
        }
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}

if ($results.Count -eq 1) {
    $resultsJson = "[" + ($results[0] | ConvertTo-Json -Compress) + "]"
} elseif ($results.Count -eq 0) {
    $resultsJson = "[]"
} else {
    $resultsJson = $results | ConvertTo-Json -Compress
}
Write-Output "---RESULT_START---"
Write-Output $resultsJson
Write-Output "---RESULT_END---"
