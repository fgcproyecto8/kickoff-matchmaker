
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  posicion TEXT DEFAULT 'Sin definir',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  partidos_jugados INT DEFAULT 0,
  ganados INT DEFAULT 0,
  perdidos INT DEFAULT 0,
  goles INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Canchas table
CREATE TABLE public.canchas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  precio INT DEFAULT 0,
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.canchas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view canchas" ON public.canchas FOR SELECT TO authenticated USING (true);

-- Horarios disponibles por cancha
CREATE TABLE public.horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancha_id UUID REFERENCES public.canchas(id) ON DELETE CASCADE NOT NULL,
  hora TEXT NOT NULL,
  disponible BOOLEAN DEFAULT true
);

ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view horarios" ON public.horarios FOR SELECT TO authenticated USING (true);

-- Partidos table
CREATE TABLE public.partidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  cancha_id UUID REFERENCES public.canchas(id) NOT NULL,
  creador_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  horario TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  es_publico BOOLEAN DEFAULT true,
  max_jugadores INT DEFAULT 10,
  estado TEXT DEFAULT 'abierto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public partidos" ON public.partidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create partidos" ON public.partidos FOR INSERT TO authenticated WITH CHECK (auth.uid() = creador_id);
CREATE POLICY "Creators can update their partidos" ON public.partidos FOR UPDATE TO authenticated USING (auth.uid() = creador_id);
CREATE POLICY "Creators can delete their partidos" ON public.partidos FOR DELETE TO authenticated USING (auth.uid() = creador_id);

-- Participantes (join table)
CREATE TABLE public.participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID REFERENCES public.partidos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partido_id, user_id)
);

ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participantes" ON public.participantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join partidos" ON public.participantes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave partidos" ON public.participantes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed canchas
INSERT INTO public.canchas (nombre, ubicacion, precio) VALUES
  ('La Bombonerita F5', 'Palermo', 12000),
  ('Complejo River F5', 'Núñez', 14500),
  ('Soccer Park', 'Belgrano', 11000),
  ('El Monumental F5', 'Belgrano', 13000);

-- Seed horarios
INSERT INTO public.horarios (cancha_id, hora) 
SELECT c.id, h.hora FROM public.canchas c
CROSS JOIN (VALUES ('18:00'), ('19:00'), ('20:00'), ('21:00'), ('22:00')) AS h(hora);
