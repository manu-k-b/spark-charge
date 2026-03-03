
-- Drop old tables (order matters for foreign keys)
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.charging_sessions CASCADE;
DROP TABLE IF EXISTS public.charger_status CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop old function/trigger
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 1. charger_status: real-time hardware metrics
CREATE TABLE public.charger_status (
  id text PRIMARY KEY DEFAULT 'charger-001',
  relay boolean NOT NULL DEFAULT false,
  voltage numeric NOT NULL DEFAULT 0,
  current numeric NOT NULL DEFAULT 0,
  power_kw numeric NOT NULL DEFAULT 0,
  energy numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.charger_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view charger status" ON public.charger_status FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update charger" ON public.charger_status FOR UPDATE TO authenticated USING (true);

-- Seed default charger row
INSERT INTO public.charger_status (id) VALUES ('charger-001');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.charger_status;

-- 2. wallet: user balances
CREATE TABLE public.wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallet FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallet FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallet FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. charging_session: session records
CREATE TABLE public.charging_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  charger_id text NOT NULL DEFAULT 'charger-001',
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  start_energy numeric NOT NULL DEFAULT 0,
  end_energy numeric,
  used_energy numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.charging_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.charging_session FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.charging_session FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.charging_session FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 4. settings: global config
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);

-- Seed default price
INSERT INTO public.settings (key, value) VALUES ('price_per_kwh', 8);

-- 5. Auto-create wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallet (user_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
