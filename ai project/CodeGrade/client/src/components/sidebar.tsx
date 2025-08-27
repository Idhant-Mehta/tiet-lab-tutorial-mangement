import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
}

export default function Sidebar({ items }: SidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-6">
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-4 h-4" />
              <span className={item.active ? "font-medium" : ""}>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
