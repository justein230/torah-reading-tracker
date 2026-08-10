// Individual icon subpath imports (e.g. '@tabler/icons-react/dist/esm/icons/IconHome.mjs') avoid pulling
// the full icon set into the Vite dev bundle, which the barrel import does. The package ships no
// per-icon .d.ts, so declare the shape here.
declare module '@tabler/icons-react/dist/esm/icons/*.mjs' {
  import type { ComponentType, SVGProps } from 'react';

  interface TablerIconProps extends Partial<Omit<SVGProps<SVGSVGElement>, 'stroke'>> {
    size?: string | number;
    stroke?: string | number;
  }

  const Icon: ComponentType<TablerIconProps>;
  export default Icon;
}
