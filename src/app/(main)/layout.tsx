import ChatFAB from "@/components/ChatFAB";
import SignOutButton from "@/components/SignOutButton";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="border-b border-border bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <a href="/" className="inline-block">
              <h1 className="font-display text-3xl md:text-4xl text-warm-dark tracking-tight">
                Julie&apos;s Cookbook
              </h1>
              <p className="text-warm-light text-sm mt-1 font-body">
                Simple recipes, made with love
              </p>
            </a>
          </div>
          <nav className="flex justify-center items-center gap-6 mt-3">
            <a href="/" className="font-body text-sm text-warm hover:text-warm-dark transition-colors">
              Recipes
            </a>
            <a href="/log" className="font-body text-sm text-warm hover:text-warm-dark transition-colors">
              Food Log
            </a>
            <a href="/grocery-list" className="font-body text-sm text-warm hover:text-warm-dark transition-colors">
              Grocery List
            </a>
            <a href="/add-recipe" className="font-body text-sm text-warm hover:text-warm-dark transition-colors">
              Add Recipe
            </a>
            <span className="text-border">|</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-border bg-cream py-4 text-center">
        <p className="font-body text-xs text-warm-light">
          Have feedback? Tap the chat bubble or message Slim directly.
        </p>
      </footer>
      <ChatFAB />
    </>
  );
}
