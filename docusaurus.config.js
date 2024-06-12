// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '华师一高校指南',
  tagline: '送给华师一毕业生的高校选择指南。',
  favicon: 'img/logo.png',

  // Set the production url of your site here
  url: 'https://dev.lozumi.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/hsy-into-college/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Lozumi', // Usually your GitHub org/user name.
  projectName: 'HSYIntoCollege', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/Lozumi/HSYIntoCollege/edit/main/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.a
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/Lozumi/HSYIntoCollege/edit/main/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: '高校指南',
        logo: {
          alt: '华师一高校指南',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: '文档',
          },
          {
            type: 'docSidebar',
            sidebarId: 'majorGuide',
            position: 'left',
            label: '专业指南',
          },
          {
            type: 'docSidebar',
            sidebarId: 'lifeGuide',
            position: 'left',
            label: '生活指南',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/facebook/docusaurus',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '文档',
            items: [
              {
                label: '专业图鉴',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: '相关网站',
            items: [
              {
                label: '情系华一论坛',
                href: 'https://bbs.hsyer.top',
              },
              {
                label: '华中师大一附中官网',
                href: 'https://www.hzsdyfz.com.cn',
              },
            ],
          },
          {
            title: '更多',
            items: [
              {
                label: '博客',
                to: '/blog',
              },
              {
                label: '仓库',
                href: 'https://github.com/Lozumi/HSYIntoCollege',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
