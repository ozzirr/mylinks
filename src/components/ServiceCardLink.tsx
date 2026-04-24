'use client';

import {Link} from '@/i18n/navigation';
import type {ReactNode} from 'react';

type Props = {
  slug: string;
  href: string;
  children: ReactNode;
  className?: string;
};

export default function ServiceCardLink({slug: _slug, href, children, className}: Props) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
