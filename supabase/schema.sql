-- ============================================================
-- Fease-it Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Users are managed by Supabase Auth (auth.users table)

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'New Project',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Scenario 1',
  sort_order INT NOT NULL DEFAULT 0,
  -- All inputs stored as JSONB for rapid iteration
  inputs JSONB NOT NULL DEFAULT '{}',
  -- Cached results (optional, for speed)
  results JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Projects: users can only access their own
CREATE POLICY "Users can CRUD own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

-- Scenarios: users can only access scenarios in their own projects
CREATE POLICY "Users can CRUD scenarios in own projects"
  ON scenarios FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Chat Threads (turn-based conversation model)
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_user_id ON chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_project_id ON chat_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_status ON chat_threads(status);

CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

-- Users can only access their own chat threads
CREATE POLICY "Users can CRUD own chat threads"
  ON chat_threads FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- Chat Turns (individual user + assistant exchanges)
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_message TEXT NOT NULL DEFAULT '',
  assistant_message TEXT NOT NULL DEFAULT '',
  user_message_json JSONB NOT NULL DEFAULT '{}',
  assistant_message_json JSONB NOT NULL DEFAULT '{}',
  tool_calls JSONB NOT NULL DEFAULT '[]',
  model TEXT,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  assistant_feedback TEXT,
  edited_assistant_message TEXT,
  feedback_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_turns_thread_id ON chat_turns(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_turns_user_id ON chat_turns(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_turns_created_at ON chat_turns(created_at);

ALTER TABLE chat_turns ENABLE ROW LEVEL SECURITY;

-- Users can only access turns in their own threads
CREATE POLICY "Users can CRUD turns in own threads"
  ON chat_turns FOR ALL
  USING (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

-- Allow service role to bypass RLS (for server-side operations if needed)
-- This is automatic in Supabase; service_role key bypasses RLS.
