INSERT INTO user_role_assignments ("userId", "roleId", "assignedAt", "assignedBy")
SELECT u.id, r.id, NOW(), 1
FROM users u
CROSS JOIN user_roles r
WHERE u.email = 'shareef.hiasat@gmail.com'
  AND r.code = 'SUPER_ADMIN'
ON CONFLICT ("userId", "roleId") DO NOTHING;
