import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Trophy, Mail, Lock, User } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await signIn(email, password);
        if (error) { setError(error.message); return; }
      } else {
        if (!nombre.trim()) { setError("Ingresá tu nombre"); return; }
        const { error } = await signUp(email, password, nombre);
        if (error) { setError(error.message); return; }
      }
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Partido<span className="text-primary">Ya</span>
        </h1>
        <p className="text-sm text-muted-foreground">Organizá tu fútbol 5</p>
      </div>

      <div className="mb-6 flex w-full max-w-sm overflow-hidden rounded-xl bg-secondary">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Iniciar Sesión
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Registrate
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {tab === "register" && (
          <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <Button type="submit" variant="success" size="full" disabled={loading}>
          {loading ? "Cargando..." : tab === "login" ? "Ingresar" : "Registrarse"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {tab === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
          <button
            type="button"
            onClick={() => setTab(tab === "login" ? "register" : "login")}
            className="text-primary underline"
          >
            {tab === "login" ? "Registrate" : "Iniciá sesión"}
          </button>
        </p>
      </form>
    </div>
  );
}
