"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Camera,
  Upload,
} from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input, InputLabel } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface Props {
  recipe: {
    id: string;
    name: string;
    servings: number | null;
    prepTime: number | null;
    cookTime: number | null;
    cuisineTag: string | null;
  };
}

const CUISINES = [
  "American",
  "Moroccan",
  "Italian",
  "Asian",
  "Mediterranean",
  "Other",
];

export default function RecipeActions({ recipe }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(recipe.name);
  const [servings, setServings] = useState(String(recipe.servings || ""));
  const [prepTime, setPrepTime] = useState(String(recipe.prepTime || ""));
  const [cookTime, setCookTime] = useState(String(recipe.cookTime || ""));
  const [cuisineTag, setCuisineTag] = useState(recipe.cuisineTag || "");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("recipeId", recipe.id);
      fd.append("file", file);
      const res = await fetch("/api/recipe/photo", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setUploadError(body.error || "Upload failed");
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/recipe", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: recipe.id,
        name: name.trim(),
        servings: servings ? parseInt(servings) || null : null,
        prepTime: prepTime ? parseInt(prepTime) || null : null,
        cookTime: cookTime ? parseInt(cookTime) || null : null,
        cuisineTag: cuisineTag || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function handleDelete() {
    setSaving(true);
    const res = await fetch("/api/recipe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipe.id }),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/");
    }
  }

  // Delete confirmation
  if (deleting) {
    return (
      <div className="bg-card border border-rule rounded shadow-lift-sm p-6 mb-8">
        <h3 className="font-display text-[22px] text-accent-ink mb-2">
          Delete this recipe?
        </h3>
        <p className="font-sans text-sm text-ink-soft mb-6">
          This will permanently remove <strong>{recipe.name}</strong> and all
          its ingredients. This cannot be undone.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDelete}
            disabled={saving}
            className={cn(
              buttonClass("primary"),
              "bg-accent-ink hover:bg-accent-ink disabled:bg-ink-mute",
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Yes, delete
          </button>
          <Button
            variant="secondary"
            onClick={() => setDeleting(false)}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Edit form
  if (editing) {
    return (
      <div className="bg-card border border-rule rounded shadow-lift-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-[22px] text-ink">Edit recipe</h3>
          <Button
            variant="icon"
            onClick={() => setEditing(false)}
            aria-label="Close edit form"
          >
            <span className="w-8 h-8 rounded-full bg-paper flex items-center justify-center text-ink-soft hover:bg-rule/40 transition-colors">
              <X className="w-4 h-4" />
            </span>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="sm:col-span-2 space-y-2">
            <InputLabel htmlFor="edit-name">Recipe name</InputLabel>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <InputLabel htmlFor="edit-servings">Servings</InputLabel>
            <Input
              id="edit-servings"
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <InputLabel htmlFor="edit-cuisine">Cuisine</InputLabel>
            <select
              id="edit-cuisine"
              value={cuisineTag}
              onChange={(e) => setCuisineTag(e.target.value)}
              className="w-full px-4 py-3 rounded bg-paper border border-rule font-sans text-[15px] text-ink outline-none transition-colors focus:border-accent"
            >
              <option value="">None</option>
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <InputLabel htmlFor="edit-prep">Prep time (min)</InputLabel>
            <Input
              id="edit-prep"
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <InputLabel htmlFor="edit-cook">Cook time (min)</InputLabel>
            <Input
              id="edit-cook"
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save changes
        </Button>
      </div>
    );
  }

  // Action buttons (default state)
  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEditing(true)}
          className={cn(buttonClass("ghost"), "border border-rule px-4 py-2.5")}
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(buttonClass("ghost"), "border border-rule px-4 py-2.5")}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {uploading ? "Uploading…" : "Replace photo"}
        </button>
        <button
          onClick={() => setDeleting(true)}
          className={cn(
            buttonClass("ghost"),
            "border border-rule px-4 py-2.5 text-accent-ink hover:text-accent-ink",
          )}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handlePhotoSelected}
      />
      {uploadError && (
        <div className="mt-3 bg-paper border border-accent-ink/30 rounded px-4 py-2 font-sans text-sm text-accent-ink flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {uploadError}
        </div>
      )}
    </div>
  );
}
