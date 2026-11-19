import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Torah Reading Tracker',
  tagline: 'Track which aliyot you have read',
  favicon: 'img/favicon.png',

  url: 'https://docs.torah.justein.com',
  baseUrl: '/',
  organizationName: 'justein230',
  projectName: 'torah-reading-tracker',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // To add Hebrew: add 'he' to locales and `localeConfigs: { he: { direction: 'rtl' } }`, then run
  // `npm run write-translations -- --locale he` and translate the files under site/i18n/he/.
  // Pages without a translation fall back to the English content.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        // Docs-only site: the docs are the home page.
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/justein230/torah-reading-tracker/tree/main/site/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      // Offline search: the index is built by `docusaurus build`, so it is empty under `start`.
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        docsRouteBasePath: '/',
        indexBlog: false,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Torah Reading Tracker',
      logo: { alt: 'Torah Reading Tracker logo', src: 'img/logo.svg' },
      items: [
        { type: 'localeDropdown', position: 'right' },
        {
          href: 'https://github.com/justein230/torah-reading-tracker',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [{ label: 'About and credits', to: '/about' }],
      copyright: 'Torah Reading Tracker is open source (MIT).',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'docker', 'ini', 'nginx'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
