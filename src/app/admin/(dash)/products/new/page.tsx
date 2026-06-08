import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
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
      <PageHeader eyebrow="Catalog" title="New product" subtitle="Add an item to your catalog." />
      <ProductForm />
    </>
  );
}
