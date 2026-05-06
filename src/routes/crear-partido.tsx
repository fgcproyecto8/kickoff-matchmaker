import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Clock, Pen, Globe, Lock } from "lucide-react";

export const Route = createFileRoute("/crear-partido")({
  component: CrearPartidoPage,
});

interface Cancha {
  id: string;
  nombre: string;
  ubicacion: string;
  precio: number;
  horarios: { id: string; hora: string }[];
}

function CrearPartidoPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [selectedCancha, setSelectedCancha] = useState<string | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esPublico, setEsPublico] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchCanchas();
  }, []);

  const fetchCanchas = async () => {
    const { data: canchasData } = await supabase
      .from("canchas")
      .select("*, horarios(id, hora)")
      .order("nombre");
    if (canchasData) {
      setCanchas(
        canchasData.map((c) => ({
          ...c,
          precio: c.precio || 0,
          horarios: (c.horarios || []) as { id: string; hora: string }[],
        }))
      );
    }
    setLoading(false);
  };

  const selectedCanchaData = canchas.find((c) => c.id === selectedCancha);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCancha || !selectedHorario || !nombre.trim()) {
      setError("Completá todos los campos requeridos");
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: partido, error: createError } = await supabase
      .from("partidos")
      .insert({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        cancha_id: selectedCancha,
        creador_id: user.id,
        horario: selectedHorario,
        es_publico: esPublico,
      })
      .select("id")
      .single();

    if (createError || !partido) {
      setError("Error al crear el partido");
      setSubmitting(false);
      return;
    }

    // Auto-join creator
    await supabase.from("participantes").insert({
      partido_id: partido.id,
      user_id: user.id,
    });

    navigate({ to: "/mis-partidos" });
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="flex items-center gap-3 px-4 pt-6">
        <Link to="/">
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Crear Partido</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Canchas disponibles</h2>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 w-64 flex-shrink-0 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {canchas.map((cancha) => (
              <button
                key={cancha.id}
                type="button"
                onClick={() => {
                  setSelectedCancha(cancha.id);
                  setSelectedHorario(null);
                }}
                className={`flex-shrink-0 w-64 rounded-xl bg-card p-4 text-left transition-all ${
                  selectedCancha === cancha.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-primary/20">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{cancha.nombre}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {cancha.ubicacion}
                </p>
                {selectedCancha === cancha.id && (
                  <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    Seleccionado
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedCanchaData && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Horarios</h3>
            <div className="flex flex-wrap gap-2">
              {selectedCanchaData.horarios.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHorario(h.hora)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-all ${
                    selectedHorario === h.hora
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> {h.hora}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Detalles del partido</h2>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Nombre del partido</label>
            <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
              <Pen className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ej. El Clásico de los Miércoles"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Descripción (opcional)</label>
            <textarea
              placeholder="Comenta algo sobre el partido..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
            <div className="flex items-center gap-3">
              {esPublico ? <Globe className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="font-medium text-foreground">
                  {esPublico ? "Partido Público" : "Partido Privado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {esPublico ? "Cualquiera puede unirse" : "Solo con invitación"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEsPublico(!esPublico)}
              className={`h-7 w-12 rounded-full transition-colors ${esPublico ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`h-5 w-5 rounded-full bg-foreground transition-transform ${esPublico ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          variant="success"
          size="full"
          className="mt-6"
          disabled={submitting || !selectedCancha || !selectedHorario || !nombre.trim()}
        >
          {submitting ? "Creando..." : "Crear Partido"}
        </Button>
      </form>
    </div>
  );
}
