// CreatorView's useParams runs on the client; Next 16 cacheComponents requires a Suspense boundary.
import { Suspense } from "react";
import CreatorView from "./CreatorView";

export default function CreatorPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-8 text-muted">Carregando ficha do creator…</main>}>
      <CreatorView />
    </Suspense>
  );
}
