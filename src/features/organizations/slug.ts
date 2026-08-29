export function createOrganizationSlug(name: string, suffix: string) {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);

  return `${normalized || 'workspace'}-${suffix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8)}`;
}
