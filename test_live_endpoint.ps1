$body = @{
    bill = @{
        centre_short_code = "1011"
        centre_name = "TEST JOINT LIVE"
        is_joint = 1
        category = "joint"
        zone = "zone1_ne_wb"
        slab_discount_percent = 35.0
        total_discount_percent = 35.0
        total_examinees = 30
        joint_data = @{
            combined_examinees = 30
            slab_name = "15-35"
            disciplines = @{
                indian = @{
                    active = $true
                    items = @(
                        @{ level_name = "Praveshika"; exam_fee = 270; old_count = 0; new_count = 15; convocation_fee = 0 }
                    )
                }
                western = @{
                    active = $true
                    items = @(
                        @{ level_name = "Initial"; exam_fee = 300; old_count = 0; new_count = 15; convocation_fee = 0 }
                    )
                }
            }
        }
    }
} | ConvertTo-Json -Depth 6

$res = Invoke-RestMethod -Uri "http://localhost:3001/api/export/whatsapp-images" -Method Post -Body $body -ContentType "application/json"
Write-Output "SUCCESS: $($res.success)"
Write-Output "IMAGES COUNT: $($res.images.Count)"
foreach ($im in $res.images) {
    Write-Output "Image key: $($im.key) | Caption: $($im.caption) | Base64 len: $($im.base64.Length)"
}
