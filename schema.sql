CREATE TABLE IF NOT EXISTS sasapps_demo_state (
  id text PRIMARY KEY CHECK (id = 'current'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
