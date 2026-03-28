import ChatFAB from "@/components/ChatFAB";
import SignOutButton from "@/components/SignOutButton";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="glass sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="inline-block">
            <h1 className="font-display text-xl text-warm-dark tracking-tight">
              Julie&apos;s Cookbook
            </h1>
          </a>
          <nav className="flex items-center gap-6">
            <a href="/" className="font-body text-sm text-warm-light hover:text-gold transition-colors">
              Recipes
            </a>
            <a href="/log" className="font-body text-sm text-warm-light hover:text-gold transition-colors">
              Food Log
            </a>
            <a href="/grocery-list" className="font-body text-sm text-warm-light hover:text-gold transition-colors">
              Grocery List
            </a>
            <a href="/add-recipe" className="font-body text-sm text-warm-light hover:text-gold transition-colors">
              Add Recipe
            </a>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-glass-border py-4 text-center">
        <p className="font-body text-xs text-warm-light/50">
          Have feedback? Tap the chat bubble or message Slim directly.
        </p>
      </footer>
      <ChatFAB />
    </>
  );
}
