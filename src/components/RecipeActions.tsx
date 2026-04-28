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
      // Reset the input so the same file can be re-selected if needed.
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
      <div className="glass rounded-[2rem] p-6 mb-8">
        <h3 className="text-lg font-bold text-red-600 mb-2">
          Delete this recipe?
        </h3>
        <p className="text-slate-500 text-sm mb-6">
          This will permanently remove <strong>{recipe.name}</strong> and all
          its ingredients. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Yes, Delete
          </button>
          <button
            onClick={() => setDeleting(false)}
            disabled={saving}
            className="px-6 py-3 glass rounded-2xl text-slate-600 font-bold hover:bg-white/60 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Edit form
  if (editing) {
    return (
      <div className="glass rounded-[2rem] p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Edit Recipe</h3>
          <button
            onClick={() => setEditing(false)}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="sm:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">
              Recipe Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl glass-input text-slate-800 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">
              Servings
            </label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-full h-12 px-4 rounded-xl glass-input text-slate-800 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">
              Cuisine
            </label>
            <select
              value={cuisineTag}
              onChange={(e) => setCuisineTag(e.target.value)}
              className="w-full h-12 px-4 rounded-xl glass-input text-slate-800 font-bold"
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
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">
              Prep Time (min)
            </label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full h-12 px-4 rounded-xl glass-input text-slate-800 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] pl-1">
              Cook Time (min)
            </label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className="w-full h-12 px-4 rounded-xl glass-input text-slate-800 font-bold"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>
    );
  }

  // Action buttons (default state)
  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 px-4 py-2.5 glass rounded-2xl text-slate-600 font-bold text-sm hover:bg-white/60 active:scale-95 transition-all"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 glass rounded-2xl text-slate-600 font-bold text-sm hover:bg-white/60 active:scale-95 transition-all disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {uploading ? "Uploading..." : "Replace photo"}
        </button>
        <button
          onClick={() => setDeleting(true)}
          className="flex items-center gap-2 px-4 py-2.5 glass rounded-2xl text-red-500 font-bold text-sm hover:bg-red-50 active:scale-95 transition-all"
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
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600 font-medium flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {uploadError}
        </div>
      )}
    </div>
  );
}
