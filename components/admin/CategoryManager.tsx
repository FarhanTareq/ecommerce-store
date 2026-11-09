"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteCategoryAction, saveCategoryAction } from "@/app/admin/actions";
import type { Category } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import ImageUploader from "./ImageUploader";

type FormState = {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  image: "",
  sortOrder: "0",
  active: true,
};

type CategoryManagerProps = {
  categories: Category[];
  counts: Record<string, number>;
  uploadEnabled: boolean;
};

export default function CategoryManager({
  categories,
  counts,
  uploadEnabled,
}: CategoryManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setEditing(null);
    setForm(emptyForm);
    setSlugTouched(false);
  }

  function startEdit(category: Category) {
    setEditing(category);
    setSlugTouched(true);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      sortOrder: String(category.sortOrder),
      active: category.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await saveCategoryAction(
        {
          name: form.name,
          slug: form.slug || slugify(form.name),
          description: form.description,
          image: form.image,
          sortOrder: Number(form.sortOrder) || 0,
          active: form.active,
        },
        editing?.id,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      reset();
      router.refresh();
    } catch {
      toast.error("Could not save the category");
    } finally {
      setSaving(false);
    }
  }

  async function remove(category: Category) {
    const used = counts[category.slug] ?? 0;
    if (used) {
      toast.error(
        `“${category.name}” has ${used} product${used === 1 ? "" : "s"}. Move or delete them first.`,
      );
      return;
    }
    if (!window.confirm(`Delete “${category.name}”? This cannot be undone.`)) return;
    setDeleting(category.id);
    try {
      const result = await deleteCategoryAction(category.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Category deleted");
      if (editing?.id === category.id) reset();
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
      <form
        onSubmit={submit}
        className="h-fit rounded-2xl border border-ink/10 bg-white p-5 xl:sticky xl:top-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">{editing ? "Edit category" : "Create a category"}</h2>
          {editing ? (
            <button
              type="button"
              onClick={reset}
              className="grid h-9 w-9 place-items-center rounded-full text-ink/40 hover:bg-paper hover:text-ink"
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="category-name">Name</label>
            <input
              id="category-name"
              required
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  slug: !slugTouched || !current.slug ? slugify(name) : current.slug,
                }));
              }}
              className="input"
              placeholder="e.g. Tennis"
            />
          </div>

          <div>
            <label className="label" htmlFor="category-slug">URL slug</label>
            <input
              id="category-slug"
              required
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                update("slug", slugify(event.target.value));
              }}
              className="input"
              placeholder="tennis"
            />
          </div>

          <div>
            <label className="label" htmlFor="category-description">Short description</label>
            <textarea
              id="category-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              className="input min-h-24 resize-y"
              placeholder="Rackets, balls and court essentials."
              maxLength={300}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="category-order">Sort order</label>
              <input
                id="category-order"
                type="number"
                min={0}
                max={999}
                value={form.sortOrder}
                onChange={(event) => update("sortOrder", event.target.value)}
                className="input"
              />
            </div>
            <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => update("active", event.target.checked)}
                className="h-4 w-4 accent-black"
              />
              Active
            </label>
          </div>

          <div>
            <span className="label">Category image</span>
            <ImageUploader
              images={form.image ? [{ key: "", url: form.image, alt: form.name }] : []}
              onChange={(next) => update("image", next[next.length - 1]?.url ?? "")}
              enabled={uploadEnabled}
              maxImages={1}
              showAlt={false}
              label="Upload a category image"
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-volt mt-5 w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Save changes" : "Create category"}
        </button>
      </form>

      <div className="space-y-3">
        {categories.map((category) => {
          const used = counts[category.slug] ?? 0;
          return (
            <article
              key={category.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-white p-3 sm:gap-4 sm:p-4",
                category.active ? "border-ink/10" : "border-dashed border-ink/20 opacity-70",
              )}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#e8e6df] to-[#d5d2c8] sm:h-20 sm:w-20">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="display grid h-full place-items-center text-lg font-bold text-ink/25">
                    {category.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-bold">{category.name}</h3>
                  {!category.active ? (
                    <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/50">
                      Hidden
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-ink/45">/shop/{category.slug}</p>
                <p className="mt-1 text-xs text-ink/45">
                  {used} product{used === 1 ? "" : "s"} · position {category.sortOrder}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(category)}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-ink/10 text-ink/50 transition hover:border-ink hover:text-ink"
                  aria-label={`Edit ${category.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(category)}
                  disabled={deleting === category.id}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-ink/10 text-ink/50 transition hover:border-coral hover:text-coral disabled:opacity-40"
                  aria-label={`Delete ${category.name}`}
                >
                  {deleting === category.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </article>
          );
        })}

        {!categories.length ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-8 text-center">
            <Plus className="mx-auto h-7 w-7 text-ink/25" />
            <p className="mt-2 text-sm text-ink/50">No categories yet. Create your first one.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
