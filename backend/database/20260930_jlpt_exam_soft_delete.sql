SET @jlpt_deleted_at_missing = (
    SELECT COUNT(*) = 0
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'jlpt_exams'
      AND column_name = 'deleted_at'
);

SET @jlpt_deleted_at_migration = IF(
    @jlpt_deleted_at_missing,
    'ALTER TABLE jlpt_exams ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
    'SELECT 1'
);
PREPARE jlpt_deleted_at_statement FROM @jlpt_deleted_at_migration;
EXECUTE jlpt_deleted_at_statement;
DEALLOCATE PREPARE jlpt_deleted_at_statement;

SET @jlpt_is_deleted_missing = (
    SELECT COUNT(*) = 0
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'jlpt_exams'
      AND column_name = 'is_deleted'
);

SET @jlpt_is_deleted_migration = IF(
    @jlpt_is_deleted_missing,
    'ALTER TABLE jlpt_exams ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER deleted_at',
    'SELECT 1'
);
PREPARE jlpt_is_deleted_statement FROM @jlpt_is_deleted_migration;
EXECUTE jlpt_is_deleted_statement;
DEALLOCATE PREPARE jlpt_is_deleted_statement;

SET @jlpt_is_deleted_backfill = IF(
    @jlpt_is_deleted_missing,
    'UPDATE jlpt_exams SET is_deleted = 1 WHERE deleted_at IS NOT NULL',
    'SELECT 1'
);
PREPARE jlpt_is_deleted_backfill_statement FROM @jlpt_is_deleted_backfill;
EXECUTE jlpt_is_deleted_backfill_statement;
DEALLOCATE PREPARE jlpt_is_deleted_backfill_statement;
