import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-volt">
          <SearchX className="h-7 w-7" />
        </span>
        <p className="display mt-6 text-7xl font-bold">404</p>
        <h1 className="display mt-2 text-2xl font-bold">This page went out of bounds.</h1>
        <p className="mt-2 text-sm leading-6 text-ink/50">
          The page you are looking for may have moved, sold out or never existed. Let&apos;s get you
          back to the gear.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-dark">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
          <Link href="/shop" className="btn-outline">Shop gear</Link>
        </div>
      </div>
    </div>
  );
}
