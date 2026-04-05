import type { ReactNode } from 'react';

export interface LibraryTab {
  id: string;
  label: string;
  badge?: number;
  render: () => ReactNode;
}
