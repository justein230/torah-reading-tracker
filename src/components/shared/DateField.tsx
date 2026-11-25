import { DateInput, type DateInputProps } from '@mantine/dates';
import { isTouch } from '../AliyahTooltip.js';

// On touch devices, focusing a DateInput would bring up the on-screen keyboard. The keyboard
// shrinks the viewport after the calendar has already been placed below the field, so its bottom
// rows end up behind the keyboard (and the bottom nav). Dates are picked from the calendar there
// anyway, so suppress the keyboard. Desktop keeps typing a date.
const TOUCH_PROPS: Partial<DateInputProps> = isTouch ? { inputMode: 'none' } : {};

// Mantine locks the dropdown's side (above/below) once it opens; let it re-flip if the page
// scrolls or resizes underneath it so it never stays pinned to a side that no longer fits.
const POPOVER_PROPS: DateInputProps['popoverProps'] = { preventPositionChangeWhenVisible: false };

/** DateInput whose calendar stays on screen on phones. Same props as Mantine's DateInput. */
export function DateField({ popoverProps, ...props }: Readonly<DateInputProps>) {
  return <DateInput {...TOUCH_PROPS} {...props} popoverProps={{ ...POPOVER_PROPS, ...popoverProps }} />;
}
