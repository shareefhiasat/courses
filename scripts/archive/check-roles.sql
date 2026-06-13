SELECT u.email, ur.code 
FROM users u 
JOIN user_role_assignments ura ON u.id = ura."userId" 
JOIN user_roles ur ON ura."roleId" = ur.id 
WHERE u.email = 'hr5@example.com';
