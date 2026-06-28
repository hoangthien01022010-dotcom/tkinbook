
-- user_profiles MUST exist before is_admin() references it
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text NOT NULL DEFAULT 'Người dùng',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  is_online boolean DEFAULT false,
  last_active timestamptz,
  is_admin boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  ban_type text DEFAULT 'none',
  ban_until timestamptz,
  chat_disabled boolean NOT NULL DEFAULT false,
  warnings int NOT NULL DEFAULT 0,
  is_bot boolean NOT NULL DEFAULT false,
  bot_persona text,
  ai_daily_count int NOT NULL DEFAULT 0,
  ai_daily_date date,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM public.user_profiles WHERE user_id = _uid), false);
$$;

CREATE POLICY "profiles read all" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles insert own" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles update own" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles admin update all" ON public.user_profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (true);
CREATE POLICY "profiles admin delete" ON public.user_profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'direct',
  name text,
  avatar_url text,
  participant_ids uuid[] NOT NULL DEFAULT '{}',
  participant_names text[] NOT NULL DEFAULT '{}',
  admin_id uuid,
  last_message text,
  last_message_sender uuid,
  last_message_time timestamptz,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv member read" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "conv insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = ANY(participant_ids));
CREATE POLICY "conv member update" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = ANY(participant_ids)) WITH CHECK (true);
CREATE POLICY "conv member delete" ON public.conversations FOR DELETE TO authenticated USING (auth.uid() = ANY(participant_ids));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_name text,
  sender_avatar text,
  content text DEFAULT '',
  type text NOT NULL DEFAULT 'text',
  file_url text,
  file_name text,
  read_by uuid[] NOT NULL DEFAULT '{}',
  deleted_by uuid[] NOT NULL DEFAULT '{}',
  is_recalled boolean NOT NULL DEFAULT false,
  recalled_at timestamptz,
  is_ai boolean NOT NULL DEFAULT false,
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg read by members" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids))
);
CREATE POLICY "msg insert by members" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids))
);
CREATE POLICY "msg update by members" ON public.messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids))
) WITH CHECK (true);
CREATE POLICY "msg delete by sender" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());
CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_date);

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_date timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friend read own" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, receiver_id));
CREATE POLICY "friend insert as requester" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friend update own" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() IN (requester_id, receiver_id)) WITH CHECK (true);
CREATE POLICY "friend delete own" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() IN (requester_id, receiver_id));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  body text,
  related_id uuid,
  from_user_name text,
  from_user_avatar text,
  is_read boolean NOT NULL DEFAULT false,
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif read own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif insert any auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif update own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (true);
CREATE POLICY "notif delete own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.call_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE,
  host_id uuid NOT NULL,
  host_name text,
  name text,
  participant_ids uuid[] NOT NULL DEFAULT '{}',
  participant_names text[] NOT NULL DEFAULT '{}',
  participant_cameras jsonb NOT NULL DEFAULT '{}'::jsonb,
  participant_mics jsonb NOT NULL DEFAULT '{}'::jsonb,
  call_type text NOT NULL DEFAULT 'video',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz,
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_rooms TO authenticated;
GRANT ALL ON public.call_rooms TO service_role;
ALTER TABLE public.call_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room read auth" ON public.call_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "room insert auth" ON public.call_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "room update auth" ON public.call_rooms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "room delete host" ON public.call_rooms FOR DELETE TO authenticated USING (auth.uid() = host_id);

CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_enabled boolean NOT NULL DEFAULT true,
  deep_enabled boolean NOT NULL DEFAULT true,
  direct_enabled boolean NOT NULL DEFAULT true,
  fast_max_words int NOT NULL DEFAULT 100,
  analysis_depth int NOT NULL DEFAULT 3,
  daily_message_limit int NOT NULL DEFAULT 50,
  total_usage int NOT NULL DEFAULT 0,
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_settings read auth" ON public.ai_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_settings auth insert" ON public.ai_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ai_settings auth update" ON public.ai_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reporter_name text,
  reported_user_id uuid,
  reported_user_name text,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  action_taken text,
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report insert auth" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "report read own or admin" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.is_admin(auth.uid()));
CREATE POLICY "report admin update" ON public.reports FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name, is_admin)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Người dùng'),
    LOWER(NEW.email) = 'hoangthien10ku@gmail.com'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      is_admin = public.user_profiles.is_admin OR EXCLUDED.is_admin;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.user_profiles (user_id, email, display_name, is_admin)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), true
FROM auth.users WHERE LOWER(email) = 'hoangthien10ku@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_rooms;
