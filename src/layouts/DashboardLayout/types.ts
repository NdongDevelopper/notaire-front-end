import type { ComponentType, SVGProps } from 'react';

export type NavigationItem = {
  label: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};
