import { generateOpenApiDocument } from "@/lib/openapi/generate";
import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function ApiDocsPage() {
  const spec = generateOpenApiDocument();
  const paths = Object.entries(spec.paths ?? {});

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 font-sans text-slate-900">
      <header className="mb-10 border-b border-slate-200 pb-6">
        <p className="text-sm font-medium text-emerald-700">The Chattala API Platform</p>
        <h1 className="mt-2 text-3xl font-bold">{spec.info.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">{spec.info.description}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/api/openapi.json" className="rounded-md bg-emerald-600 px-3 py-1.5 text-white">
            Download OpenAPI JSON
          </Link>
          <span className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-600">
            Deprecation policy: docs/API_DEPRECATION_POLICY.md
          </span>
        </div>
      </header>

      <section className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <h2 className="font-semibold">Versioning</h2>
        <p className="mt-2 text-slate-700">
          Use <code className="rounded bg-white px-1">/api/v1/*</code> for new integrations. Legacy unversioned routes
          remain available with <code className="rounded bg-white px-1">Deprecation</code> headers until{" "}
          {new Date("2026-12-31").toLocaleDateString("en-GB")}.
        </p>
      </section>

      <section className="space-y-8">
        {paths.map(([path, methods]) => (
          <article key={path} className="rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-mono text-lg font-semibold">{path}</h2>
            <div className="mt-4 space-y-4">
              {Object.entries(methods ?? {}).map(([method, operation]) => {
                const op = operation as {
                  summary?: string;
                  description?: string;
                  tags?: string[];
                  responses?: Record<string, { description?: string }>;
                };
                return (
                  <div key={`${path}-${method}`} className="rounded-lg bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs uppercase text-emerald-800">
                        {method}
                      </span>
                      {op.tags?.map((tag) => (
                        <span key={tag} className="rounded bg-white px-2 py-0.5 text-xs text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 font-medium">{op.summary}</p>
                    {op.description ? <p className="mt-1 text-sm text-slate-600">{op.description}</p> : null}
                    {op.responses ? (
                      <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        {Object.entries(op.responses).map(([code, response]) => (
                          <li key={code} className="rounded border border-slate-200 bg-white px-2 py-1">
                            <strong>{code}</strong> — {response.description ?? "Response"}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
