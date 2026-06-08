import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import { deleteProduct } from "@/app/admin/products/actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <>
      <div className="mb-2">
        <Link
          href="/admin/products"
          className="text-sm font-semibold text-kava-600 hover:text-kava-700"
        >
          ← Back to products
        </Link>
      </div>

      <PageHeader eyebrow="Catalog" title={product.name} subtitle={`/${product.slug}`}>
        <Link href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          View ↗
        </Link>
      </PageHeader>

      <ProductForm product={product} />

      {/* Danger zone */}
      <div className="mt-10 rounded-3xl border border-coral/20 bg-coral/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-ink">Delete product</h2>
            <p className="mt-0.5 text-sm text-ink/55">
              Permanently removes this product and its stock history. Past orders keep their
              snapshot.
            </p>
          </div>
          <form action={deleteProduct} className="shrink-0">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmitButton
              className="btn bg-coral px-6 py-3 text-white shadow-soft hover:bg-coral/90"
              pendingLabel="Deleting…"
              confirm={`Delete "${product.name}"? This cannot be undone.`}
            >
              Delete product
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
    </>
  );
}
