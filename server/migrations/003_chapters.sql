-- =============================================================================
-- 003_chapters.sql — таблицы chapters + chapter_locations, seed для Kings of Ruin
-- Generated from data/chapters/kor.json by scripts/generate_chapters_migration.py
-- =============================================================================

CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    menu_order INTEGER NOT NULL,
    UNIQUE(campaign_id, code)
);
CREATE INDEX IF NOT EXISTS idx_chapters_campaign ON chapters(campaign_id);

CREATE TABLE IF NOT EXISTS chapter_locations (
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    location_dn INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (chapter_id, location_dn)
);
CREATE INDEX IF NOT EXISTS idx_chapter_locations_dn ON chapter_locations(location_dn);

-- Seed глав только если chapters для данной кампании пуст —
-- защищает ручные правки из edit-mode от перезаписи при повторном прогоне миграции.
DO $$
DECLARE
    v_campaign_id INTEGER;
    v_source_id INTEGER := 26;
    v_chapter_id INTEGER;
BEGIN
    SELECT id INTO v_campaign_id FROM campaigns WHERE source_id = v_source_id;
    IF v_campaign_id IS NULL THEN
        RAISE NOTICE 'Campaign source_id=% not found, skipping chapter seed', v_source_id;
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM chapters WHERE campaign_id = v_campaign_id) THEN
        RAISE NOTICE 'Chapters already seeded for campaign %, skipping', v_campaign_id;
        RETURN;
    END IF;

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '1', 'Глава 1', 1) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 101, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 103, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 104, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 105, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 106, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 107, 5);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 109, 6);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 110, 7);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 203, 8);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 205, 9);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '2', 'Глава 2', 2) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 112, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 113, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 114, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 115, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 116, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 118, 5);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 119, 6);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 120, 7);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 122, 8);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 123, 9);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 126, 10);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 216, 11);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 218, 12);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 219, 13);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '3', 'Глава 3', 3) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 118, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 120, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 121, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 124, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 216, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 218, 5);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '4', 'Глава 4', 4) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 117, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 121, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 122, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 124, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 125, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 216, 5);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '5', 'Глава 5', 5) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 102, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 107, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 108, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 110, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 111, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 112, 5);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 113, 6);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 114, 7);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 115, 8);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 118, 9);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 124, 10);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 127, 11);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 150, 12);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 205, 13);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 217, 14);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 218, 15);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '6', 'Глава 6', 6) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 111, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 112, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 127, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 129, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 141, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 150, 5);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 153, 6);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 154, 7);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 155, 8);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 252, 9);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 332, 10);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '7', 'Глава 7', 7) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 111, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 127, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 129, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 132, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 133, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 137, 5);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 139, 6);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 152, 7);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 153, 8);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 156, 9);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 157, 10);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 158, 11);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 159, 12);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 160, 13);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 161, 14);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 232, 15);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 261, 16);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '8', 'Глава 8', 8) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 128, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 132, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 133, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 136, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 137, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 138, 5);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 139, 6);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 140, 7);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 153, 8);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 155, 9);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 156, 10);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 162, 11);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 232, 12);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 255, 13);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '9', 'Глава 9', 9) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 127, 0);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 128, 1);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 129, 2);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 130, 3);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 131, 4);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 133, 5);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 134, 6);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 135, 7);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 136, 8);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 137, 9);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 138, 10);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 139, 11);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 140, 12);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 150, 13);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 151, 14);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 152, 15);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 153, 16);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 155, 17);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 156, 18);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 160, 19);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 241, 20);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 254, 21);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 255, 22);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 258, 23);
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 259, 24);

    INSERT INTO chapters (campaign_id, code, title, menu_order) VALUES (v_campaign_id, '10', 'Глава 10', 10) RETURNING id INTO v_chapter_id;
    INSERT INTO chapter_locations (chapter_id, location_dn, sort_order) VALUES (v_chapter_id, 111, 0);

    RAISE NOTICE 'Seeded % chapters for campaign %',
        10, v_campaign_id;
END
$$;
