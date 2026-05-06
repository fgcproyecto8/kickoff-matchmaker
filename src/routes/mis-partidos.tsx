import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Clock, Users, Globe, Lock, Bell, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mis-partidos")({
  component: MisPartidosPage,
});

interface PartidoFull {
  id: string;
  nombre: string;
  horario: string;
  fecha: string;
  es_publico: boolean | null;
  max_jugadores: number | null;
  estado: string | null;
  creador_id: string;
  cancha: { nombre: string; ubicacion: string } | null;
  participantes_count: number;
}

function MisPartidosPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"creados" | "unidos">("creados");
  const [creados, setCreados] = useState<PartidoFull[]>([]);
  const [unidos, setUnidos] = useState<PartidoFull[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchMisPartidos();
  }, [user]);

  const fetchMisPartidos = async () => {
    if (!user) return;
    setLoading(true);

    // Creados
    const { data: creadosData } = await supabase
      .from("partidos")
      .select("*, canchas(nombre, ubicacion)")
      .eq("creador_id", user.id)
      .order("created_at", { ascending: false });

    if (creadosData) {
      const withCount = await Promise.all(
        creadosData.map(async (p) => {
          const { count } = await supabase
            .from("participantes")
            .select("*", { count: "exact", head: true })
            .eq("partido_id", p.id);
          return {
            ...p,
            cancha: p.canchas as { nombre: string; ubicacion: string } | null,
            participantes_count: count || 0,
          };
        })
      );
      setCreados(withCount);
    }

    // Unidos (where I'm a participant but not creator)
    const { data: participaciones } = await supabase
      .from("participantes")
      .select("partido_id")
      .eq("user_id", user.id);

    if (participaciones && participaciones.length > 0) {
      const ids = participaciones.map((p) => p.partido_id);
      const { data: unidosData } = await supabase
        .from("partidos")
        .select("*, canchas(nombre, ubicacion)")
        .in("id", ids)
        .neq("creador_id", user.id)
        .order("created_at", { ascending: false });

      if (unidosData) {
        const withCount = await Promise.all(
          unidosData.map(async (p) => {
            const { count } = await supabase
              .from("participantes")
              .select("*", { count: "exact", head: true })
              .eq("partido_id", p.id);
            return {
              ...p,
              cancha: p.canchas as { nombre: string; ubicacion: string } | null,
              participantes_count: count || 0,
            };
          })
        );
        setUnidos(withCount);
      }
    } else {
      setUnidos([]);
    }

    setLoading(false);
  };

  const handleCancel = async (partidoId: string) => {
    await supabase.from("partidos").delete().eq("id", partidoId);
    fetchMisPartidos();
  };

  const handleLeave = async (partidoId: string) => {
    if (!user) return;
    await supabase.from("participantes").delete().eq("partido_id", partidoId).eq("user_id", user.id);
    fetchMisPartidos();
  };

  if (authLoading || !user) return null;

  const currentList = tab === "creados" ? creados : unidos;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Mis Partidos</h1>
        </div>
        <Bell className="h-5 w-5 text-primary" />
      </div>

      <div className="mx-4 mt-4 flex overflow-hidden rounded-xl bg-secondary">
        <button
          onClick={() => setTab("creados")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "creados" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Creados
        </button>
        <button
          onClick={() => setTab("unidos")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "unidos" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Unidos
        </button>
      </div>

      <div className="px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Próximos Partidos</h2>
          <span className="text-sm text-primary">
            {currentList.length} {currentList.length === 1 ? "Partido" : "Activos"}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">
              {tab === "creados" ? "No creaste partidos aún" : "No te uniste a ningún partido"}
            </p>
            {tab === "unidos" && (
              <Link to="/" className="mt-2 block text-sm text-primary">
                Explorar canchas
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((partido) => {
              const isFull = partido.participantes_count >= partido.max_jugadores;
              const faltantes = partido.max_jugadores - partido.participantes_count;
              return (
                <div key={partido.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">{partido.nombre}</h3>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      partido.es_publico ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      {partido.es_publico ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {partido.es_publico ? "PÚBLICO" : "PRIVADO"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {partido.cancha?.nombre}, {partido.cancha?.ubicacion}
                    </p>
                    <div className="flex gap-4">
                      <p className="flex items-center gap-1">📅 {partido.fecha}</p>
                      <p className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {partido.horario}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className={isFull ? "text-primary" : "text-primary"}>
                        <Users className="mr-1 inline h-3.5 w-3.5" />
                        {isFull ? "Cupos completos" : `Faltan ${faltantes} jugadores`}
                      </span>
                      <span className="text-foreground">
                        {partido.participantes_count}/{partido.max_jugadores}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${(partido.participantes_count / partido.max_jugadores) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {tab === "creados" ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCancel(partido.id)}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="success" size="sm" className="flex-1">
                          <Eye className="h-4 w-4" /> Ver detalles
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleLeave(partido.id)}>
                          Salir del partido
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
