import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Plus, MapPin, Clock, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface Partido {
  id: string;
  nombre: string;
  horario: string;
  fecha: string;
  es_publico: boolean | null;
  max_jugadores: number | null;
  estado: string | null;
  cancha: { nombre: string; ubicacion: string } | null;
  participantes_count: number;
  creador_id: string;
}

function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [myPartidos, setMyPartidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchPartidos();
  }, [user]);

  const fetchPartidos = async () => {
    setLoading(true);
    const { data: partidosData } = await supabase
      .from("partidos")
      .select("*, canchas(nombre, ubicacion)")
      .eq("es_publico", true)
      .eq("estado", "abierto")
      .order("fecha", { ascending: true });

    if (partidosData) {
      const partidosWithCount = await Promise.all(
        partidosData.map(async (p) => {
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
      setPartidos(partidosWithCount);
    }

    // Get user's joined partidos
    const { data: myP } = await supabase
      .from("participantes")
      .select("partido_id")
      .eq("user_id", user!.id);
    if (myP) setMyPartidos(new Set(myP.map((p) => p.partido_id)));
    setLoading(false);
  };

  const handleJoin = async (partidoId: string) => {
    if (!user) return;
    setJoining(partidoId);
    const { error } = await supabase.from("participantes").insert({
      partido_id: partidoId,
      user_id: user.id,
    });
    if (!error) {
      await fetchPartidos();
    }
    setJoining(null);
  };

  if (authLoading || !user) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="text-muted-foreground">Cargando...</div></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Hola,</p>
            <h1 className="text-xl font-bold text-foreground">
              {user.user_metadata?.nombre || "Usuario"} ⚽
            </h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            {(user.user_metadata?.nombre || user.email || "U")[0].toUpperCase()}
          </div>
        </div>

        <Link to="/crear-partido">
          <Button variant="success" size="full" className="mb-6">
            <Plus className="h-5 w-5" /> Crear partido
          </Button>
        </Link>

        <h2 className="mb-4 text-lg font-bold text-foreground">Partidos abiertos</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : partidos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">No hay partidos abiertos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partidos.map((partido) => {
              const isFull = partido.participantes_count >= partido.max_jugadores;
              const alreadyJoined = myPartidos.has(partido.id);
              return (
                <div key={partido.id} className="rounded-xl bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{partido.nombre}</h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {partido.cancha?.nombre}, {partido.cancha?.ubicacion}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {partido.horario}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span className={isFull ? "text-primary" : "text-primary"}>
                            {partido.participantes_count}/{partido.max_jugadores}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all"
                          style={{ width: `${(partido.participantes_count / partido.max_jugadores) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-3">
                      {alreadyJoined ? (
                        <span className="text-xs text-primary font-medium">Unido</span>
                      ) : isFull ? (
                        <span className="text-xs text-muted-foreground">Completo</span>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleJoin(partido.id)}
                          disabled={joining === partido.id}
                        >
                          {joining === partido.id ? "..." : "Unirse"}
                        </Button>
                      )}
                    </div>
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
