Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\SASWATA\.gemini\antigravity\brain\feb72794-f641-45b4-8b93-81b9308c82a3\test_hd.png"
$croppedPath = "C:\Users\SASWATA\.gemini\antigravity\brain\feb72794-f641-45b4-8b93-81b9308c82a3\test_hd_cropped.png"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

# Find bounding box
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0

# Check pixels from bottom up to find table bottom
for ($y = $h - 1; $y -ge 0; $y -= 2) {
    for ($x = 0; $x -lt $w; $x += 2) {
        $c = $bmp.GetPixel($x, $y)
        # Check if pixel is not pure white (R < 250 or G < 250 or B < 250)
        if ($c.R -lt 250 -or $c.G -lt 250 -or $c.B -lt 250) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Detected bounds: Left=$minX, Top=$minY, Right=$maxX, Bottom=$maxY"

# Add small 2px padding
$cropX = [Math]::Max(0, $minX - 2)
$cropY = [Math]::Max(0, $minY - 2)
$cropW = [Math]::Min($w - $cropX, ($maxX - $minX) + 6)
$cropH = [Math]::Min($h - $cropY, ($maxY - $minY) + 6)

$rect = [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH)
$croppedBmp = $bmp.Clone($rect, $bmp.PixelFormat)
$bmp.Dispose()

$croppedBmp.Save($croppedPath, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBmp.Dispose()

Write-Host "Cropped image saved! Width: $cropW Height: $cropH"
