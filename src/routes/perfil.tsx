import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, MapPin, Edit, LogOut, Trophy, Target, TrendingDown, Crosshair } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  component: PerfilPage,
});

interface Profile {
  nombre: string;
  posicion: string;
  bio: string;
  avatar_url: string | null;
  partidos_jugados: number;
  ganados: number;
  perdidos: number;
  goles: number;
}

function PerfilPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: "", posicion: "", bio: "" });

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data as Profile);
      setEditForm({ nombre: data.nombre || "", posicion: data.posicion || "", bio: data.bio || "" });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    await supabase.from("profiles").update({
      nombre: editForm.nombre,
      posicion: editForm.posicion,
      bio: editForm.bio,
    }).eq("id", user.id);
    setEditing(false);
    fetchProfile();
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (authLoading || !user || loading) return null;

  const stats = [
    { icon: Target, label: "Partidos jugados", value: profile?.partidos_jugados || 0, color: "text-primary" },
    { icon: Trophy, label: "Ganados", value: profile?.ganados || 0, color: "text-primary" },
    { icon: TrendingDown, label: "Perdidos", value: profile?.perdidos || 0, color: "text-foreground" },
    { icon: Crosshair, label: "Goles", value: profile?.goles || 0, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center justify-between px-4 pt-6">
        <Link to="/">
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Mi Perfil</h1>
        <Bell className="h-5 w-5 text-primary" />
      </div>

      <div className="mt-6 flex flex-col items-center px-4">
        <div className="relative mb-4">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-primary bg-card text-4xl font-bold text-primary">
            {(profile?.nombre || "U")[0].toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Edit className="h-4 w-4" />
          </div>
        </div>

        {editing ? (
          <div className="w-full max-w-sm space-y-3">
            <input
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              className="w-full rounded-xl bg-secondary px-4 py-3 text-foreground outline-none"
              placeholder="Nombre"
            />
            <input
              value={editForm.posicion}
              onChange={(e) => setEditForm({ ...editForm, posicion: e.target.value })}
              className="w-full rounded-xl bg-secondary px-4 py-3 text-foreground outline-none"
              placeholder="Posición (ej: Delantero)"
            />
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full rounded-xl bg-secondary px-4 py-3 text-foreground outline-none resize-none"
              placeholder="Bio"
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="success" size="full" onClick={handleSave}>Guardar</Button>
              <Button variant="outline" size="full" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground">{profile?.nombre || "Usuario"}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                {profile?.posicion || "Sin definir"}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" /> Buenos Aires, Argentina
              </span>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
              Editar perfil
            </Button>
          </>
        )}
      </div>

      <div className="mx-4 mt-6 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {profile?.bio && (
        <div className="mx-4 mt-4 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 font-semibold text-primary">Biografía</h3>
          <p className="text-sm text-foreground">{profile.bio}</p>
        </div>
      )}

      <div className="mx-4 mt-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl bg-destructive/10 px-4 py-4 text-destructive"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
