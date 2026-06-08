"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Product } from "@prisma/client";
import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "@/app/admin/products/actions";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/products";
import { centsToDollars } from "@/lib/money";

const initialState: ProductFormState = { error: null };

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-coral">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink/45">{hint}</p>
      ) : null}
    </div>
  );
}

function SaveButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
    </button>
  );
}

export default function ProductForm({ product }: { product?: Product }) {
  const mode: "create" | "edit" = product ? "edit" : "create";
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    action,
    initialState
  );
  const fe = state.fieldErrors ?? {};

  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setImageUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral ring-1 ring-inset ring-coral/20"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card-surface space-y-5 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Details</h2>

            <Field label="Name" htmlFor="name" error={fe.name}>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={product?.name ?? ""}
                placeholder="Tropical Bliss Gummies"
                className="field"
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="slug"
              hint="Leave blank to auto-generate from the name."
              error={fe.slug}
            >
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={product?.slug ?? ""}
                placeholder="auto from name"
                className="field"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" htmlFor="category" error={fe.category}>
                <select
                  id="category"
                  name="category"
                  defaultValue={product?.category ?? "GUMMIES"}
                  className="field"
                >
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Flavor" htmlFor="flavor" error={fe.flavor}>
                <input
                  id="flavor"
                  name="flavor"
                  type="text"
                  defaultValue={product?.flavor ?? ""}
                  placeholder="Mango Lychee"
                  className="field"
                />
              </Field>
            </div>

            <Field
              label="Short description"
              htmlFor="shortDescription"
              hint="One-line summary shown on product cards."
              error={fe.shortDescription}
            >
              <input
                id="shortDescription"
                name="shortDescription"
                type="text"
                defaultValue={product?.shortDescription ?? ""}
                placeholder="Calm in a chew — 100mg noble kava per gummy."
                className="field"
              />
            </Field>

            <Field label="Description" htmlFor="description" error={fe.description}>
              <textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={product?.description ?? ""}
                placeholder="Full product story, ingredients, usage…"
                className="field resize-y"
              />
            </Field>
          </div>

          <div className="card-surface space-y-5 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Pricing</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Price (USD)" htmlFor="price" error={fe.priceCents}>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink/40">
                    $
                  </span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={product ? centsToDollars(product.priceCents) : ""}
                    placeholder="29.00"
                    className="field no-spin pl-7"
                  />
                </div>
              </Field>

              <Field
                label="Compare-at (USD)"
                htmlFor="compareAt"
                hint="Optional — shows a struck-through original price."
                error={fe.compareAtCents}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink/40">
                    $
                  </span>
                  <input
                    id="compareAt"
                    name="compareAt"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={
                      product?.compareAtCents != null
                        ? centsToDollars(product.compareAtCents)
                        : ""
                    }
                    placeholder="39.00"
                    className="field no-spin pl-7"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="card-surface space-y-5 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Media</h2>
            <Field
              label="Product photo"
              htmlFor="imageUrl"
              hint="Upload a photo or paste an image URL. Leave blank for the accent-color gradient placeholder."
              error={fe.imageUrl}
            >
              <div className="space-y-3">
                {imageUrl ? (
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Product preview"
                      className="h-20 w-20 rounded-xl object-cover ring-1 ring-sand"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-sm font-medium text-coral hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <label className="btn-secondary cursor-pointer">
                    {uploading ? "Uploading…" : "Upload photo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={handleFile}
                      disabled={uploading}
                    />
                  </label>
                  <span className="text-xs text-ink/40">PNG, JPG, WEBP, GIF, AVIF — up to 8&nbsp;MB</span>
                </div>

                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…/product.jpg  (or upload above)"
                  className="field"
                />
                {uploadError ? (
                  <p className="text-xs font-medium text-coral">{uploadError}</p>
                ) : null}
              </div>
            </Field>

            <Field label="Accent color" htmlFor="accentColor" error={fe.accentColor}>
              <div className="flex items-center gap-3">
                <input
                  id="accentColor"
                  name="accentColor"
                  type="color"
                  defaultValue={product?.accentColor ?? "#1fa85c"}
                  className="h-11 w-16 cursor-pointer rounded-xl border border-sand bg-white p-1"
                />
                <span className="text-sm text-ink/50">
                  Used for the gradient placeholder &amp; product card.
                </span>
              </div>
            </Field>
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-6">
          <div className="card-surface space-y-5 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Visibility</h2>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product ? product.active : true}
                className="mt-0.5 h-5 w-5 rounded border-sand text-kava-500 focus:ring-kava-400"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Active</span>
                <span className="block text-xs text-ink/45">
                  Visible &amp; purchasable in the storefront.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product ? product.featured : false}
                className="mt-0.5 h-5 w-5 rounded border-sand text-kava-500 focus:ring-kava-400"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Featured</span>
                <span className="block text-xs text-ink/45">
                  Highlighted on the home page.
                </span>
              </span>
            </label>
          </div>

          <div className="card-surface space-y-5 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Inventory &amp; sorting</h2>

            <Field label="SKU" htmlFor="sku" error={fe.sku}>
              <input
                id="sku"
                name="sku"
                type="text"
                defaultValue={product?.sku ?? ""}
                placeholder="KL-GUM-001"
                className="field"
              />
            </Field>

            <Field
              label="Low-stock threshold"
              htmlFor="lowStockThreshold"
              hint="Flagged as low when stock falls to or below this."
              error={fe.lowStockThreshold}
            >
              <input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.lowStockThreshold ?? 12}
                className="field no-spin"
              />
            </Field>

            <Field
              label="Sort order"
              htmlFor="sortOrder"
              hint="Lower numbers appear first."
              error={fe.sortOrder}
            >
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                step="1"
                defaultValue={product?.sortOrder ?? 0}
                className="field no-spin"
              />
            </Field>

            {mode === "create" ? (
              <Field
                label="Initial stock"
                htmlFor="initialStock"
                hint="Recorded as an INITIAL stock movement."
              >
                <input
                  id="initialStock"
                  name="initialStock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={0}
                  className="field no-spin"
                />
              </Field>
            ) : (
              <div className="rounded-xl bg-sand/60 px-4 py-3 text-sm text-ink/60">
                Current stock:{" "}
                <span className="font-semibold text-ink">{product?.stock ?? 0}</span>
                <p className="mt-0.5 text-xs text-ink/45">
                  Adjust stock from the Inventory screen.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-sand pt-6">
        <Link href="/admin/products" className="btn-secondary">
          Cancel
        </Link>
        <SaveButton mode={mode} />
      </div>
    </form>
  );
}
