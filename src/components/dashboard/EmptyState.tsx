import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  ctaLabel,
  ctaTo,
  onCta,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCta?: () => void;
}) {
  return (
    <div className="ring-gradient glass rounded-2xl p-8 text-center">
      <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow mb-3">
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {ctaLabel && (ctaTo || onCta) && (
        <div className="mt-4">
          {ctaTo ? (
            <Button asChild size="sm">
              <Link to={ctaTo}>{ctaLabel}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={onCta}>{ctaLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}
