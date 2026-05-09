import { Bell, LogOut, Moon, Search, Sparkles, Sun } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const initial = (user?.user_metadata?.display_name ?? user?.email ?? "?")
    .toString()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between gap-4 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl font-semibold truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 glass rounded-lg px-3 py-1.5 text-sm text-muted-foreground w-72">
          <Search className="h-4 w-4" />
          <input
            placeholder="Search schedule, subjects, sessions…"
            className="bg-transparent outline-none flex-1 placeholder:text-muted-foreground/70"
          />
        </div>
        <Button size="icon" variant="ghost" className="rounded-lg">
          <Bell className="h-4 w-4" />
        </Button>
        <Button size="sm" className="bg-gradient-primary hover:opacity-90 shadow-glow">
          <Sparkles className="h-4 w-4 mr-1" /> Ask Forge
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center text-sm font-semibold text-primary-foreground shadow-glow">
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
