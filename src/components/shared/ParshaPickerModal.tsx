import React, { useState, useEffect, useRef } from 'react';
import { Modal, TextInput } from '@mantine/core';
import { App as CapacitorApp } from '@capacitor/app';
import type { SeferMeta } from '../../types/index.js';
import './ParshaPickerModal.css';

interface ParshaPickerModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (parsha: string) => void;
  value?: string;
  SEFER_ORDER: string[];
  SEFER_MAP: Record<string, SeferMeta>;
  parshaIndex: Record<string, string[]>;
  TLIT: Record<string, string>;
}

export function ParshaPickerModal({ opened, onClose, onSelect, value, SEFER_ORDER, SEFER_MAP, parshaIndex, TLIT }: Readonly<ParshaPickerModalProps>) {
  const [query,       setQuery]       = useState('');
  const [modalHeight, setModalHeight] = useState('100dvh');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (opened) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
      const listenerPromise = CapacitorApp.addListener('backButton', () => {
        onClose();
      });
      // Cleanup: resolve the promise and remove the listener.
      // async cleanup is safe here because React ignores the returned value.
      return () => { void listenerPromise.then(l => l.remove()); };
    }
  }, [opened, onClose]);

  // visualViewport fires on both iOS Safari and Android Chrome when the
  // software keyboard appears/disappears, giving the true visible height.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !opened) return;
    const update = () => setModalHeight(vv.height + 'px');
    vv.addEventListener('resize', update);
    update();
    return () => vv.removeEventListener('resize', update);
  }, [opened]);

  const q = query.toLowerCase();
  const sections = SEFER_ORDER
    .map(sefer => ({
      sefer,
      parshas: (parshaIndex[sefer] ?? []).filter(p =>
        q === '' ||
        p.toLowerCase().includes(q) ||
        (TLIT[p] ?? '').toLowerCase().includes(q)
      ),
    }))
    .filter(s => s.parshas.length > 0);

  function pick(p: string) {
    onSelect(p);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Select Parsha"
      fullScreen
      padding="md"
      styles={{ content: { height: modalHeight }, body: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } }}
      classNames={{ header: 'modal-header-safe' }}
    >
      <TextInput
        ref={inputRef}
        placeholder="Search parsha or transliteration…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoComplete="off"
      />
      <div className="parsha-picker-list">
        {sections.map(({ sefer, parshas }) => (
          <div key={sefer}>
            <div className="parsha-picker-section-label">{SEFER_MAP[sefer]?.en}</div>
            {parshas.map(p => (
              <button
                key={p}
                type="button"
                className={`parsha-picker-row${value === p ? ' selected' : ''}`}
                onClick={() => pick(p)}
              >
                <span className="hebrew parsha-picker-heb">{p}</span>
                <span className="parsha-picker-tlit">{TLIT[p] ?? ''}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  );
}
