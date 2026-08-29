import { ButtonLink } from '@/components/ui/button';
export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center p-5 text-center">
      <div>
        <p className="text-sm font-bold text-[var(--accent)]">404</p>
        <h1 className="display mt-3 text-4xl font-semibold">
          This frame is empty.
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          The page may have moved or the event link is incorrect.
        </p>
        <ButtonLink href="/" className="mt-7">
          Go home
        </ButtonLink>
      </div>
    </main>
  );
}
