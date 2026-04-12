# Create Test User in Keycloak
Write-Host "Creating test user in Keycloak..."

# Get admin token
try {
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:8080/realms/master/protocol/openid-connect/token" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "grant_type=password&username=admin&password=admin123&client_id=admin-cli"
    $adminToken = $tokenResponse.access_token
    
    if (-not $adminToken) {
        Write-Host "Failed to get admin token"
        exit 1
    }
    
    Write-Host "Admin token obtained successfully"
    
    # Check if user already exists
    try {
        $existingUser = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/military-lms/users?username=shareef.hiasat@gmail.com" -Method GET -Headers @{
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        }
        
        if ($existingUser.Count -gt 0) {
            Write-Host "User shareef.hiasat@gmail.com already exists"
            Write-Host "User ID: $($existingUser[0].id)"
            Write-Host "Email: $($existingUser[0].email)"
            Write-Host "Enabled: $($existingUser[0].enabled)"
            
            # Reset password if needed
            Write-Host "Resetting password to Test123@..."
            $resetBody = @{
                type = "password"
                value = "Test123@"
                temporary = $false
            } | ConvertTo-Json -Depth 10
            
            try {
                Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/military-lms/users/$($existingUser[0].id)/reset-password" -Method PUT -Headers @{
                    "Authorization" = "Bearer $adminToken"
                    "Content-Type" = "application/json"
                } -Body $resetBody
                
                Write-Host "Password reset successfully!"
            } catch {
                Write-Host "Failed to reset password: $($_.Exception.Message)"
            }
            
            exit 0
        }
    } catch {
        Write-Host "User doesn't exist, creating new user..."
    }
    
    # Create new user
    $newUser = @{
        username = "shareef.hiasat@gmail.com"
        email = "shareef.hiasat@gmail.com"
        firstName = "Shareef"
        lastName = "Hiasat"
        enabled = $true
        emailVerified = $true
        credentials = @(
            @{
                type = "password"
                value = "Test123@"
                temporary = $false
            }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        $createResponse = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/military-lms/users" -Method POST -Headers @{
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        } -Body $newUser
        
        Write-Host "User created successfully!"
        
        # Get the created user to assign roles
        Start-Sleep -Seconds 2
        $createdUser = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/military-lms/users?username=shareef.hiasat@gmail.com" -Method GET -Headers @{
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        }
        
        if ($createdUser.Count -gt 0) {
            $userId = $createdUser[0].id
            Write-Host "User ID: $userId"
            
            # Get role representations (realm roles)
            $superAdminRole = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/military-lms/roles/super_admin" -Method GET -Headers @{
                "Authorization" = "Bearer $adminToken"
            }

            $instructorRole = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/military-lms/roles/instructor" -Method GET -Headers @{
                "Authorization" = "Bearer $adminToken"
            }

            # Assign roles (Keycloak expects an array of role representations)
            $rolesToAssign = @(
                @{ id = $superAdminRole.id; name = $superAdminRole.name; composite = $false; clientRole = $false; containerId = $superAdminRole.containerId },
                @{ id = $instructorRole.id; name = $instructorRole.name; composite = $false; clientRole = $false; containerId = $instructorRole.containerId }
            )

            $roleAssignBody = $rolesToAssign | ConvertTo-Json -Depth 10

            Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/military-lms/users/$userId/role-mappings/realm" -Method POST -Headers @{
                "Authorization" = "Bearer $adminToken"
                "Content-Type" = "application/json"
            } -Body $roleAssignBody

            Write-Host "Roles assigned successfully! (super_admin, instructor)"
        }
        
    } catch {
        Write-Host "Failed to create user: $($_.Exception.Message)"
        Write-Host "Response: $($_.Exception.Response)"
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host "`n=== Test User Credentials ==="
Write-Host "Email: shareef.hiasat@gmail.com"
Write-Host "Password: Test123@"
Write-Host "Roles: super-admin, admin, instructor"
Write-Host "==========================`n"
