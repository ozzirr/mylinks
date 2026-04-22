'use client';

import {usePathname, useSearchParams, useRouter} from 'next/navigation';
import type {ReactNode, MouseEvent} from 'react';

export default function AuthTrigger({
  mode,
  className,
  children,
  onClick: onClickExtra
}: {
  mode: 'login' | 'signup';
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();

  const params = new URLSearchParams(search.toString());
  params.set('auth', mode);
  const href = `${pathname}?${params.toString()}`;

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    onClickExtra?.();
    router.replace(href, {scroll: false});
  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
