import React from 'react';
import { Box, Text } from '@mantine/core';

interface EmptyStateProps {
  icon?: string;
  message: string;
}

export function EmptyState({ icon, message }: Readonly<EmptyStateProps>) {
  return (
    <Box ta="center" mt="xl">
      {icon && <Text size="xl" mb={8}>{icon}</Text>}
      <Text c="dimmed">{message}</Text>
    </Box>
  );
}
