import { prisma } from "@/lib/db";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default async function NewsletterPage() {
  const [signups, total] = await Promise.all([
    prisma.newsletterSignup.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.newsletterSignup.count(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Newsletter"
        subtitle={`${total} subscriber${total === 1 ? "" : "s"} on the list.`}
      >
        {total > 0 ? (
          <a href="/api/admin/newsletter-export" download className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Download CSV
          </a>
        ) : null}
      </PageHeader>

      <div className="card-surface overflow-hidden">
        {signups.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-display text-lg font-semibold text-ink/70">
              No subscribers yet
            </p>
            <p className="mt-1 text-sm text-ink/45">
              Signups from the storefront newsletter form will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand text-left text-xs uppercase tracking-wider text-ink/45">
                  <th className="px-6 py-3.5 font-semibold">Email</th>
                  <th className="px-6 py-3.5 font-semibold">Discount code</th>
                  <th className="px-6 py-3.5 font-semibold">Source</th>
                  <th className="px-6 py-3.5 font-semibold">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {signups.map((s) => (
                  <tr key={s.id} className="transition hover:bg-cream/60">
                    <td className="px-6 py-3.5 font-medium text-ink">{s.email}</td>
                    <td className="px-6 py-3.5">
                      {s.discountCode ? (
                        <span className="rounded-full bg-kava-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-kava-700">
                          {s.discountCode}
                        </span>
                      ) : (
                        <span className="text-ink/30">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-ink/60">{s.source || "—"}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-ink/60">
                      {fmtDate(s.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
