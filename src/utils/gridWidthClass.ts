/* Width thresholds for the grids' responsive layout, in px of *available* width — the grids tab's own
   box, not the window. They mirror the window media queries in Grid.css (990px / 700px, less the page's
   40px of horizontal padding), which can't see that a docked side panel has taken part of the window. */
export const GRID_ONE_COLUMN_BELOW = 950;
export const GRID_SMALL_CELLS_BELOW = 660;

/**
 * Class for the grids container that Grid.css pairs with its media queries so the layout follows the
 * space actually available. Returns '' for an unmeasured (0) width so the media queries alone apply
 * until the first measurement.
 */
export function gridWidthClass(width: number): string {
  if (width <= 0) return '';
  if (width < GRID_SMALL_CELLS_BELOW) return 'grids-xs';
  if (width < GRID_ONE_COLUMN_BELOW) return 'grids-sm';
  return '';
}
