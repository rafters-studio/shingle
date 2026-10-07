export type NavItem = { label: string; href: string; exact?: boolean };
export type NavGroup = { heading: string; items: NavItem[] };

export const migratrNav: NavGroup[] = [
  {
    heading: 'migratr',
    items: [
      { label: 'Overview', href: '/migratr', exact: true },
      { label: 'CLI', href: '/migratr/cli' },
      { label: 'Migrations', href: '/migratr/migrations' },
      { label: 'Library', href: '/migratr/library' },
      { label: 'Changelog', href: '/migratr/changelog' },
    ],
  },
];
