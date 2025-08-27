import type { ReactNode } from 'react';

export const experimental_ppr = true;

export default async function WriteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background">
      {children}
    </div>
  );
}