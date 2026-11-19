import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Your data',
      collapsed: false,
      items: ['data/backup', 'data/restore'],
    },
    {
      type: 'category',
      label: 'Self-hosting',
      collapsed: true,
      items: ['deploy/docker-password', 'deploy/docker-proxy', 'deploy/configuration'],
    },
  ],
};

export default sidebars;
