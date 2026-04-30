# Hearth Component Specs

> **Pairs with:** `tailwind.config.ts` (drop-in) and `hearth-prototype.html`
> All Tailwind classes assume the Hearth config is loaded.

---

## 1. Button

**Anatomy:** padding · icon (optional, leading) · label · padding

**Variants:** `primary`, `secondary`, `ghost`

**States:** default, hover, active (pressed), disabled, loading

```tsx
// Primary
<button className="
  inline-flex items-center gap-2
  px-6 py-3.5
  font-sans font-semibold text-[15px]
  bg-brown text-cream
  rounded-pill
  transition-all duration-200 ease-hearth
  hover:bg-brown-deep hover:-translate-y-px hover:shadow-lift
  active:translate-y-0 active:shadow-lift-sm
  disabled:bg-ink-mute disabled:opacity-40 disabled:cursor-not-allowed
">
  Sign in
</button>

// Secondary
<button className="
  inline-flex items-center gap-2
  px-6 py-3.5
  font-sans font-semibold text-[15px]
  bg-transparent text-brown
  border border-brown-glass
  rounded-pill
  transition-colors duration-200
  hover:bg-brown-glass
">
  See How It Works
</button>

// Ghost
<button className="
  px-4 py-2.5
  font-sans font-medium text-sm
  bg-transparent text-ink-soft
  rounded-pill
  hover:text-ink
  transition-colors
">
  Create an account
</button>
```

**Loading state:** swap icon for `<Loader2 className="animate-spin" />`, keep label.

---

## 2. Chip

**Anatomy:** pill container · optional leading icon · label

**States:** default, hover, active (selected)

```tsx
<button
  className="
  inline-flex items-center gap-1.5
  px-3 py-1.5
  font-sans font-medium text-[13px]
  bg-linen text-ink-soft
  rounded-pill
  border border-transparent
  transition-colors duration-150
  hover:bg-linen-dim
  data-[active=true]:bg-brown data-[active=true]:text-cream
"
>
  Quick
</button>
```

---

## 3. Card

**Anatomy:** linen surface · radius · resting shadow

```tsx
<div
  className="
  bg-linen rounded
  shadow-lift-sm
  overflow-hidden
  transition-all duration-200 ease-hearth
  hover:shadow-lift hover:-translate-y-0.5
"
>
  {children}
</div>
```

---

## 4. RecipeCard

**Anatomy:** photo (4:3 mobile, 16:11 desktop) · body (title, meta, stars)

```tsx
<button
  className="
  flex flex-col
  bg-linen rounded
  shadow-lift-sm
  overflow-hidden cursor-pointer
  transition-all duration-200 ease-hearth
  hover:-translate-y-0.5 hover:shadow-lift
"
>
  <div
    className="aspect-[4/3] md:aspect-[16/11] bg-cover bg-center"
    style={{ backgroundImage: `url(${photo})` }}
  />
  <div className="p-3.5 pb-4">
    <h3 className="font-display font-semibold text-[15px] text-ink leading-tight mb-2">
      Shakshuka
    </h3>
    <div className="flex items-center gap-2.5 font-sans text-xs text-ink-mute font-medium">
      <span className="flex items-center gap-1">
        <Clock size={11} /> 25m
      </span>
      <span className="flex items-center gap-1">
        <Flame size={11} /> 320
      </span>
    </div>
    <div className="text-gold text-[11px] mt-1.5 tracking-wider">★★★★★</div>
  </div>
</button>
```

**Empty photo fallback:** swap `<div bg-cover>` for tonal gradient `bg-gradient-to-br from-linen-dim to-linen` with a small `<UtensilsCrossed />` icon centered at 30% opacity.

---

## 5. StatRow

**Anatomy:** 4-column grid, dividers between cells, sits between hero and tabs

```tsx
<div className="grid grid-cols-4 gap-px bg-linen-dim border-y border-linen-dim">
  {stats.map((s) => (
    <div className="bg-cream py-3.5 px-2 text-center">
      <div className="font-sans text-[10px] tracking-[0.08em] uppercase text-ink-mute font-semibold mb-1">
        {s.label}
      </div>
      <div className="font-sans text-base font-semibold text-ink tabular-nums">
        {s.value}
        <span className="text-[11px] text-ink-mute font-medium">{s.unit}</span>
      </div>
    </div>
  ))}
</div>
```

---

## 6. ServingsScaler

**Anatomy:** label (left) · minus button · value · plus button (right)

**Live, no Apply button.** (Rule 7)

**Touch target:** per ADR-005, the +/- controls use `<Button variant="icon">` (44×44 invisible hit area) wrapping a `w-8 h-8` visual circle span. Hover/active styling lives on the inner span so the visible circle animates, not the invisible padding ring.

```tsx
import { Button } from "@/components/ui/Button";
import { Minus, Plus } from "lucide-react";

<div className="flex items-center justify-between px-5 py-4 bg-cream border-b border-linen-dim">
  <span className="font-serif text-sm text-ink-soft">Scale recipe</span>
  <div className="flex items-center gap-2.5">
    <Button
      variant="icon"
      onClick={() => setServings((s) => Math.max(1, s - 1))}
      disabled={servings <= 1}
      aria-label="Decrease servings"
    >
      <span
        className="
        w-8 h-8 rounded-full bg-brown text-cream
        flex items-center justify-center
        transition-transform duration-150
        hover:bg-brown-deep hover:scale-105
      "
      >
        <Minus size={16} />
      </span>
    </Button>
    <span className="font-sans text-base font-semibold text-ink min-w-[60px] text-center transition-opacity duration-200">
      {servings} {servings === 1 ? "serving" : "servings"}
    </span>
    <Button
      variant="icon"
      onClick={() => setServings((s) => Math.min(12, s + 1))}
      aria-label="Increase servings"
    >
      <span className="w-8 h-8 rounded-full bg-brown text-cream flex items-center justify-center transition-transform hover:bg-brown-deep hover:scale-105">
        <Plus size={16} />
      </span>
    </Button>
  </div>
</div>;
```

**Crossfade:** when servings changes, set quantity element opacity to 0.3 for 200ms, swap text, restore to 1.

**Disabled state:** the outer `<Button>` carries `disabled` and the base `disabled:opacity-40` from `buttonBase` cascades visually through the entire control. Do not also dim the inner span — single source of truth.

---

## 7. IngredientList

**Anatomy:** category heading · list of `{name, qty}` rows with bottom border

```tsx
<div>
  {Object.entries(grouped).map(([category, items]) => (
    <section className="mb-6">
      <h4 className="font-sans text-xs font-semibold tracking-[0.06em] uppercase text-brown mb-2.5">
        {category}
      </h4>
      {items.map((i) => (
        <div className="flex justify-between py-2.5 border-b border-linen-dim">
          <span className="font-serif text-base text-ink">{i.name}</span>
          <span className="font-sans text-sm font-medium text-ink-soft tabular-nums">
            {i.qty}
          </span>
        </div>
      ))}
    </section>
  ))}
</div>
```

---

## 8. InstructionList

**Anatomy:** numbered circle (32x32) · text (Lora 16px, line-height 1.65)

```tsx
{
  steps.map((step, i) => (
    <div className="flex gap-4 mb-6">
      <div className="flex-none w-8 h-8 rounded-full bg-brown text-cream font-sans font-semibold text-sm flex items-center justify-center">
        {i + 1}
      </div>
      <div className="font-serif text-base leading-[1.65] text-ink pt-1">
        {step}
      </div>
    </div>
  ));
}
```

---

## 9. MacroGrid

**Anatomy:** 2x2 mobile, 4-up desktop. Each cell: label (caption) + value (tabular-nums) + unit

**Bounce on change:** add `animate-macro-bounce` class for 180ms when value updates.

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {macros.map((m) => (
    <div className="bg-linen rounded p-4">
      <div className="font-sans text-[11px] tracking-[0.08em] uppercase text-ink-mute font-semibold mb-1.5">
        {m.label}
      </div>
      <div
        className={cn(
          "font-sans text-2xl font-semibold text-ink tabular-nums",
          m.changed && "animate-macro-bounce",
        )}
      >
        {m.value}
        {m.unit && (
          <span className="text-[13px] text-ink-mute font-medium ml-0.5">
            {m.unit}
          </span>
        )}
      </div>
    </div>
  ))}
</div>
```

---

## 10. PortionCalculator

**Anatomy:** eyebrow · title · large input + unit · macro grid · helper · primary CTA

**Killer feature.** Don't bury it. (Rule 8)

```tsx
<div
  className="
  bg-gradient-to-b from-linen to-linen-dim
  rounded-lg p-6 mb-6 relative overflow-hidden
"
>
  <div
    className="absolute -top-10 -right-10 w-30 h-30 rounded-full bg-leaf/10"
    aria-hidden
  />

  <div className="relative">
    <div className="font-sans text-[11px] tracking-[0.1em] uppercase text-brown font-semibold mb-1">
      Tare scale → exact macros
    </div>
    <h3 className="font-display text-[22px] font-bold text-ink mb-4">
      What's on your plate
    </h3>

    <div className="flex items-baseline gap-2 bg-cream px-5 py-4 rounded border border-brown-glass mb-5">
      <input
        type="number"
        value={grams}
        onChange={(e) => setGrams(+e.target.value)}
        className="
          flex-1 font-sans text-[28px] font-semibold text-ink
          bg-transparent outline-none p-0 tabular-nums
        "
      />
      <span className="font-sans text-sm font-medium text-ink-mute">grams</span>
    </div>

    <MacroGrid macros={portionMacros} />

    <p className="font-serif text-[13px] italic text-ink-mute mt-3">
      Total batch: {batchG}g · {servings} servings ·{" "}
      {Math.round(batchG / servings)}g per serving
    </p>

    <button className="btn-primary w-full mt-4">
      <BookmarkPlus size={16} />
      Log this meal
    </button>
  </div>
</div>
```

---

## 11. TabBar

**Anatomy:** 3 equal tabs · active underline · sticky · frosted on scroll past hero

```tsx
<div
  className="
  sticky top-16 z-40
  flex px-3
  bg-glass-base backdrop-blur-glass backdrop-saturate-glass
  border-b border-glass-line
"
>
  {tabs.map((t) => (
    <button
      onClick={() => setActive(t.id)}
      className={cn(
        "flex-1 py-3.5 px-2",
        "font-sans text-sm font-semibold",
        "border-b-2 border-transparent transition-all duration-220 ease-hearth",
        active === t.id ? "text-brown border-brown" : "text-ink-mute",
      )}
    >
      {t.label}
    </button>
  ))}
</div>
```

---

## 12. ChatFAB

**Anatomy:** 56x56 leaf-color circle, bottom-right, leaf icon

**Pulse:** `animate-fab-pulse` (defined in tailwind.config) — 1.6s ease, twice, after 3.5s delay

```tsx
<button
  onClick={openChat}
  className="
    fixed bottom-6 right-5 z-60
    w-14 h-14 rounded-full
    bg-leaf text-cream
    shadow-lift-lg
    flex items-center justify-center
    transition-transform duration-200
    hover:scale-105
    animate-fab-pulse
  "
  aria-label="Ask Cookbook"
>
  <Leaf size={24} />
</button>
```

---

## 13. ChatDrawer

**Anatomy:** glass surface, slides up from bottom, header with handle and close, scrollable messages, quick prompt chips, input row

**States:** open, closed, loading (web search "Searching the web...")

```tsx
<>
  <div
    className={cn(
      "absolute inset-0 z-70 transition-colors duration-320 ease-hearth",
      open
        ? "bg-ink/30 pointer-events-auto"
        : "bg-transparent pointer-events-none",
    )}
    onClick={onClose}
  />
  <div
    className={cn(
      "absolute bottom-0 inset-x-0 z-80 h-3/4",
      "bg-glass-base backdrop-blur-glass backdrop-saturate-glass",
      "rounded-t-lg border border-glass-line border-b-0",
      "shadow-glass",
      "transition-transform duration-320 ease-hearth",
      "flex flex-col",
      open ? "translate-y-0" : "translate-y-full",
    )}
  >
    <div className="w-9 h-1 bg-ink-mute/40 rounded mx-auto mt-2" />
    <header className="flex items-center justify-between px-5 py-4 border-b border-glass-line">
      <h3 className="font-display font-semibold text-lg text-ink">
        Ask Cookbook
      </h3>
      <button onClick={onClose} className="icon-btn">
        <X size={18} />
      </button>
    </header>
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
      {messages.map((m) => (
        <Message {...m} />
      ))}
      {thinking && <SearchingIndicator />}
    </div>
    <QuickPrompts />
    <ChatInputRow />
  </div>
</>
```

**Searching indicator:** three dots with sequential 600ms pulse

```tsx
<div className="self-start flex items-center gap-2.5 px-4 py-2.5 bg-linen rounded font-sans text-[13px] text-brown font-medium">
  <span>Searching the web</span>
  <div className="flex gap-1">
    <span className="w-1.5 h-1.5 rounded-full bg-brown animate-dot-1" />
    <span className="w-1.5 h-1.5 rounded-full bg-brown animate-dot-2" />
    <span className="w-1.5 h-1.5 rounded-full bg-brown animate-dot-3" />
  </div>
</div>
```

---

## 14. LogMealSheet

**Anatomy:** bottom sheet with handle, title, recipe picker (autocomplete), meal segmented control, portion input, notes, save CTA

**Snap points:** 60% (default), 90% (expanded for notes)

```tsx
<div
  className={cn(
    "absolute inset-x-0 bottom-0 z-95",
    "bg-cream rounded-t-lg shadow-lift-lg",
    "transition-transform duration-320 ease-hearth",
    open ? "translate-y-0" : "translate-y-full",
  )}
>
  <div className="w-9 h-1 bg-ink-mute/40 rounded mx-auto my-3" />
  <div className="px-6 pb-8">
    <h2 className="font-display font-bold text-2xl text-ink mb-5">
      Log a meal
    </h2>
    <form className="flex flex-col gap-4">
      <RecipePicker />
      <MealSegmentedControl />
      <PortionInput />
      <NotesInput />
      <button className="btn-primary w-full mt-2">Save to log</button>
    </form>
  </div>
</div>
```

**Meal segmented control:**

```tsx
<div className="grid grid-cols-4 gap-1.5 bg-linen p-1 rounded-pill">
  {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
    <button
      className={cn(
        "py-2.5 px-2 rounded-pill font-sans text-xs font-medium",
        "transition-all duration-150",
        meal === m
          ? "bg-cream text-ink font-semibold shadow-lift-sm"
          : "text-ink-mute",
      )}
    >
      {m}
    </button>
  ))}
</div>
```

---

## 15. WeekStrip

**Anatomy:** 7 day-pills, today highlighted, dot indicator under days with logged meals

```tsx
<div className="grid grid-cols-7 gap-1 px-3 py-4 border-b border-linen-dim">
  {days.map((d) => (
    <button
      className={cn(
        "py-2 rounded-sm transition-colors duration-150 text-center",
        d.active && "bg-brown",
      )}
    >
      <div
        className={cn(
          "font-sans text-[10px] font-semibold tracking-wider uppercase",
          d.active ? "text-cream" : "text-ink-mute",
        )}
      >
        {d.dow}
      </div>
      <div
        className={cn(
          "font-display font-semibold text-lg mt-0.5",
          d.active ? "text-cream" : "text-ink",
        )}
      >
        {d.num}
      </div>
      {d.hasData && (
        <div
          className={cn(
            "w-1 h-1 rounded-full mx-auto mt-1",
            d.active ? "bg-gold" : "bg-leaf",
          )}
        />
      )}
    </button>
  ))}
</div>
```

---

## 16. BarChart

**Anatomy:** vertical bars, today in leaf, others in brown, future days in linen-dim

**Tap to drill in:** click any bar → navigate to /food-log?day=X

```tsx
<div className="bg-linen rounded p-5 mb-6">
  <div className="font-sans text-[11px] tracking-[0.1em] uppercase text-ink-mute font-semibold mb-4">
    Daily calories
  </div>
  <div className="flex items-end gap-2 h-36">
    {days.map((d) => (
      <button
        onClick={() => goToDay(d.date)}
        style={{ height: `${(d.cals / maxCals) * 100}%` }}
        className={cn(
          "flex-1 rounded-t min-h-[4px]",
          "transition-colors duration-150 cursor-pointer",
          d.future
            ? "bg-linen-dim cursor-default"
            : d.today
              ? "bg-leaf hover:bg-leaf/90"
              : "bg-brown hover:bg-brown-deep",
        )}
      >
        <span className="absolute -bottom-5 left-0 right-0 text-center font-sans text-[10px] text-ink-mute font-semibold">
          {d.dow[0]}
        </span>
      </button>
    ))}
  </div>
</div>
```

---

## 17. EmptyState

**Anatomy:** circular illustration · h3 (Playfair) · prose (Lora, max-width) · primary CTA

**Tone:** warm, useful copy. Never "Nothing here yet."

```tsx
<div className="text-center py-12 px-6">
  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linen text-brown mb-5">
    <BookOpen size={36} />
  </div>
  <h3 className="font-display font-semibold text-xl text-ink mb-2">
    The kitchen is quiet.
  </h3>
  <p className="font-serif text-sm text-ink-mute leading-relaxed max-w-[240px] mx-auto mb-5">
    Import your first recipe from any URL. We'll handle the rest.
  </p>
  <button className="btn-primary">
    <Plus size={16} />
    Add a recipe
  </button>
</div>
```

**Variants by surface:**

- Gallery: "The kitchen is quiet." / "Import your first recipe."
- Food Log: "Nothing logged today, yet." / "Tap Log meal when you eat."
- Weekly: "Not enough data to chart." / "Log a few meals first."
- Chat: "What's on your mind?" / "Ask anything about your recipes."

---

## 18. ErrorState

**Anatomy:** card with ember or rust accent · icon · message · recovery action

```tsx
// Partial save (image failed)
<div className="bg-ember/10 border border-ember rounded p-4">
  <div className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-wider uppercase text-ember mb-2">
    <AlertTriangle size={12} />
    Partial
  </div>
  <p className="font-serif text-sm text-ink-soft leading-relaxed">
    Recipe saved without an image. The site didn't return a photo. You can add one later.
  </p>
</div>

// Hard error
<div className="bg-rust/[0.06] border border-rust rounded p-4">
  <div className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-wider uppercase text-rust mb-2">
    <ShieldOff size={12} />
    Blocked
  </div>
  <p className="font-serif text-sm text-ink-soft leading-relaxed">
    This site blocks scraping. Try the paste fallback below, or use a different URL.
  </p>
</div>
```

---

## 19. StepRibbon

**Anatomy:** 4 step-dots connected by progress lines, used only on `/demo`

**States per dot:** upcoming, active, complete

```tsx
<div className="flex items-center gap-2 px-6 py-5">
  {steps.map((s, i) => (
    <>
      <button
        onClick={() => setStep(s.n)}
        className="flex flex-col items-center cursor-pointer"
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "font-sans font-semibold text-sm",
            "transition-all duration-240 ease-hearth border-2 border-transparent",
            s.complete && "bg-leaf text-cream",
            s.active && "bg-brown text-cream",
            !s.complete && !s.active && "bg-linen text-ink-mute",
          )}
        >
          {s.n}
        </div>
        <div
          className={cn(
            "font-sans text-[10px] mt-1.5 tracking-wide font-medium",
            s.complete || s.active ? "text-ink-soft" : "text-ink-mute",
          )}
        >
          {s.label}
        </div>
      </button>
      {i < steps.length - 1 && (
        <div className="flex-1 h-0.5 bg-linen-dim -mt-5 relative rounded-full">
          <div
            className={cn(
              "absolute inset-0 bg-leaf rounded-full transition-[inset] duration-240 ease-hearth",
              steps[i].complete ? "right-0" : "right-full",
            )}
          />
        </div>
      )}
    </>
  ))}
</div>
```

---

## Tailwind utility additions you may want

If you want to lean on these helpers in components, add to `tailwind.config.ts`:

```ts
// inside theme.extend.spacing
spacing: {
  '30': '7.5rem', // 120px (used for portion-calc decoration circle)
}
```

Plus, for the `text-cream` background on buttons (currently hard-coded as `#f5f0e8`), I used a slightly warmer near-cream than the page background `--cream` so primary buttons feel inset rather than transparent. If you want strict cream-on-brown, swap to `text-cream` everywhere I have `text-cream` and the contrast still passes.

---

_End of component specs. Pair with `tailwind.config.ts` and `hearth-prototype.html` for the full handoff._
