"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type ReactNode } from "react";

type FilterNavigation = { pending: boolean; navigate: (query: string) => void };

const Context = createContext<FilterNavigation>({ pending: false, navigate: () => {} });

/**
 * Filter changes update the URL (shareable, back button works) without a full reload:
 * router.replace re-renders only the server results. `pending` dims them meanwhile.
 */
export function FilterNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const navigate = (query: string) =>
    startTransition(() => router.push(`${pathname}${query}`, { scroll: false }));
  return <Context.Provider value={{ pending, navigate }}>{children}</Context.Provider>;
}

export const useFilterNavigation = () => useContext(Context);

/** Wraps the results; dimmed and aria-busy while new results load. */
export function PendingResults({ children, label }: { children: ReactNode; label: string }) {
  const { pending } = useFilterNavigation();
  return (
    <div
      aria-busy={pending}
      className={`flex min-w-0 flex-col gap-5 transition-opacity duration-300 ${pending ? "opacity-50" : ""}`}
    >
      <p aria-live="polite" className="sr-only">
        {pending ? label : ""}
      </p>
      {children}
    </div>
  );
}
