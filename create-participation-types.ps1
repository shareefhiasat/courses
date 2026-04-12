$json = @{
    code = "POSITIVE"
    nameEn = "Positive Participation"
    nameAr = "مشاركة إيجابية"
    isPositive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/v1/participation-types" -Method Post -ContentType "application/json" -Body $json
