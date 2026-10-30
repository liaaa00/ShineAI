
        CREATE TABLE IF NOT EXISTS daily_board_runs (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          trigger TEXT NOT NULL,
          slot TEXT,
          status TEXT NOT NULL,
          started_at TEXT NOT NULL,
          finished_at TEXT,
          heartbeat_at TEXT,
          provider_id TEXT,
          model_id TEXT,
          sessions_total INTEGER,
          sessions_ai INTEGER,
          input_chars INTEGER,
          output_chars INTEGER,
          attempt INTEGER DEFAULT 1,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_dbr_date ON daily_board_runs(date, slot);

        CREATE TABLE IF NOT EXISTS daily_board_items (
          date TEXT NOT NULL,
          session_id TEXT NOT NULL,
          device_id TEXT NOT NULL DEFAULT 'local',
          first_at TEXT,
          last_at TEXT,
          lane_key TEXT NOT NULL,
          lane_name TEXT,
          title TEXT,
          summary TEXT,
          status TEXT NOT NULL,
          tag TEXT,
          detail TEXT,
          outputs_json TEXT,
          decision_json TEXT,
          risks TEXT,
          source TEXT NOT NULL,
          confidence TEXT,
          fingerprint TEXT NOT NULL,
          run_id TEXT,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (date, session_id, device_id)
        );

        CREATE TABLE IF NOT EXISTS daily_board_digest (
          date TEXT PRIMARY KEY,
          summary TEXT,
          kpis_json TEXT,
          run_id TEXT,
          created_at TEXT
        );
      

        CREATE TABLE IF NOT EXISTS daily_board_overrides (
          date TEXT NOT NULL,
          target_key TEXT NOT NULL,
          patch_json TEXT NOT NULL,
          base_fingerprint TEXT,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (date, target_key)
        );

        CREATE TABLE IF NOT EXISTS daily_board_entries (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          kind TEXT NOT NULL,
          members_json TEXT,
          lane_key TEXT,
          title TEXT NOT NULL,
          summary TEXT,
          status TEXT NOT NULL,
          start_at TEXT,
          end_at TEXT,
          created_at TEXT,
          updated_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_dbe_date ON daily_board_entries(date);
      
