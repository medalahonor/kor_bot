DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'progress' AND column_name = 'status'
    ) THEN
        ALTER TABLE progress ADD COLUMN status TEXT NOT NULL DEFAULT 'visited';
    END IF;
END
$$;
