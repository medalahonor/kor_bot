-- =============================================================================
-- 004_notes.sql — таблица notes для фичи «командные заметки»
-- Заметка принадлежит кампании; опциональная привязка к строфе.
-- path — массив шагов {locationDn, verseDn} от entry до target включительно.
-- verse_id (FK на target) дублируется для CASCADE при удалении строфы.
-- =============================================================================

CREATE TABLE IF NOT EXISTS notes (
    id          SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    type        TEXT    NOT NULL CHECK (type IN ('quest', 'hint', 'general')),
    body        TEXT    NOT NULL,
    verse_id    INTEGER REFERENCES verses(id) ON DELETE CASCADE,
    path        JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT notes_body_length CHECK (char_length(body) BETWEEN 1 AND 2000),
    CONSTRAINT notes_path_shape CHECK (
        path IS NULL OR (jsonb_typeof(path) = 'array' AND jsonb_array_length(path) BETWEEN 1 AND 50)
    ),
    CONSTRAINT notes_path_verse_consistency CHECK (
        (path IS NULL AND verse_id IS NULL) OR (path IS NOT NULL AND verse_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_notes_campaign_created
    ON notes(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_verse
    ON notes(verse_id) WHERE verse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_campaign_type
    ON notes(campaign_id, type, created_at DESC);
