import React from 'react';
import { Button, Group } from '@mantine/core';

type ToggleValue = string | number | null;

interface ToggleOption {
  value: ToggleValue;
  label: string;
}

interface ToggleButtonsProps {
  value: ToggleValue;
  onChange: (value: ToggleValue) => void;
  options: ToggleOption[];
  size?: string;
  gap?: number;
  variant?: string;
  className?: string;
}

export function ToggleButtons({ value, onChange, options, size = 'xs', gap = 8, variant = 'default', className }: Readonly<ToggleButtonsProps>) {
  const getVariant = (isActive: boolean) => {
    if (variant === 'default') return isActive ? 'filled' : 'subtle';
    if (variant === 'outline') return 'outline';
    return variant;
  };

  return (
    <Group gap={gap}>
      {options.map((option, i) => (
        <Button
          key={option.value === null ? `null-${i}` : String(option.value)}
          variant={getVariant(value === option.value)}
          size={size}
          className={className}
          data-active={value === option.value || undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </Group>
  );
}

// Legacy export for backwards compatibility
export const SortButtons = ToggleButtons;
