import { useState } from 'react';
import { Select, TextInput } from '@mantine/core';
import { isTouch } from '../AliyahTooltip.js';
import { ParshaPickerModal } from './ParshaPickerModal.js';
import type { SeferMeta } from '../../types/index.js';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ParshaFieldProps {
  value: string;
  onSelect: (p: string) => void;
  parshaOptions: SelectOption[];
  locked?: boolean;
  SEFER_ORDER: string[];
  SEFER_MAP: Record<string, SeferMeta>;
  parshaIndex: Record<string, string[]>;
  TLIT: Record<string, string>;
}

export function ParshaField({
  value, onSelect, parshaOptions, locked = false,
  SEFER_ORDER, SEFER_MAP, parshaIndex, TLIT,
}: Readonly<ParshaFieldProps>) {
  const [open, setOpen] = useState(false);

  if (isTouch) {
    return (
      <>
        <TextInput
          label="Parsha"
          placeholder="Select parsha…"
          value={value ? `${value}  —  ${TLIT[value] ?? ''}` : ''}
          readOnly
          disabled={locked}
          mb={12}
          onClick={() => { if (!locked) setOpen(true); }}
          styles={{ input: { cursor: locked ? 'not-allowed' : 'pointer' } }}
        />
        <ParshaPickerModal
          opened={open}
          onClose={() => setOpen(false)}
          onSelect={onSelect}
          value={value}
          SEFER_ORDER={SEFER_ORDER}
          SEFER_MAP={SEFER_MAP}
          parshaIndex={parshaIndex}
          TLIT={TLIT}
        />
      </>
    );
  }

  return (
    <Select
      label="Parsha"
      placeholder="Select parsha…"
      data={parshaOptions}
      value={value || null}
      onChange={v => onSelect(v ?? '')}
      disabled={locked}
      mb={12}
      searchable
    />
  );
}
