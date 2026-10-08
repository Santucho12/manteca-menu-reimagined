'use client';

import type { ReactNode } from 'react';
import { useAparecer } from '@/lib/menu/useAparecer';

export function Aparecer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useAparecer<HTMLDivElement>();
  return (
    <div ref={ref} className={`aparece ${className}`}>
      {children}
    </div>
  );
}
