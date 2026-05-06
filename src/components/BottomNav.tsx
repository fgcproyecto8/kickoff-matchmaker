import { Link, useLocation } from "@tanstack/react-router";
import { Home, Trophy, User } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Inicio" },
  { to: "/mis-partidos", icon: Trophy, label: "Mis Partidos" },
  { to: "/perfil", icon: User, label: "Perfil" },
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-4 py-1 text-xs transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {isActive && <span className="h-1 w-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
