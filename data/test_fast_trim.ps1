function Trim-WhiteBorders {
    param (
        [string]$imagePath
    )
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
    Write-Host "Trimmed in fast mode: Width=$cropW, Height=$cropH"
}

$sw = [System.Diagnostics.Stopwatch]::StartNew()
Add-Type -AssemblyName System.Drawing
Copy-Item "C:\Users\SASWATA\.gemini\antigravity\brain\feb72794-f641-45b4-8b93-81b9308c82a3\test_hd.png" "C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_fast_trim.png"
Trim-WhiteBorders "C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\test_fast_trim.png"
$sw.Stop()
Write-Host "Elapsed ms:" $sw.ElapsedMilliseconds
