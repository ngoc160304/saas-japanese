SET @user_role_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'role'
);

SET @user_role_migration = IF(
    @user_role_column_exists = 0,
    'ALTER TABLE users ADD COLUMN role ENUM(''admin'', ''student'') NOT NULL DEFAULT ''student'' AFTER phone',
    'SELECT 1'
);

PREPARE user_role_statement FROM @user_role_migration;
EXECUTE user_role_statement;
DEALLOCATE PREPARE user_role_statement;
