import { Link, useLocation } from "wouter";
import { Activity, BarChart3, Menu, BrainCircuit, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Predict", icon: BrainCircuit },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/upload", label: "Batch Upload", icon: Upload },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={location === item.href ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 text-base ${
              location === item.href
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        </Link>
      ))}
    </>
  );

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">TalentIQ</span>
        </div>
        <nav className="flex-1 space-y-1.5 p-4">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-border">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium text-foreground">v2.1 Precision Model</p>
            <p className="text-xs text-muted-foreground mt-1">Updated today</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">TalentIQ</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center gap-3 border-b border-border px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold tracking-tight text-foreground">TalentIQ</span>
              </div>
              <nav className="space-y-1.5 p-4">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
