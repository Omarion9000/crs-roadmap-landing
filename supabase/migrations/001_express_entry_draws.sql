-- Express Entry draws table
-- Run this in your Supabase SQL editor or via supabase db push

CREATE TABLE IF NOT EXISTS express_entry_draws (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date          date        NOT NULL,
  draw_number        int,
  program_type       text        NOT NULL,
  minimum_score      int         NOT NULL,
  invitations_issued int         NOT NULL,
  is_new             boolean     NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one row per draw number + program combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_draws_number_program
  ON express_entry_draws (draw_number, program_type)
  WHERE draw_number IS NOT NULL;

-- Unique constraint: one row per date + program (for draws without a number)
CREATE UNIQUE INDEX IF NOT EXISTS idx_draws_date_program
  ON express_entry_draws (draw_date, program_type);

-- Index for fast latest-first queries
CREATE INDEX IF NOT EXISTS idx_draws_date_desc
  ON express_entry_draws (draw_date DESC);

-- RLS: service role can read/write; authenticated users can only read
ALTER TABLE express_entry_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON express_entry_draws FOR SELECT
  USING (true);

CREATE POLICY "Service role full access"
  ON express_entry_draws FOR ALL
  USING (auth.role() = 'service_role');
