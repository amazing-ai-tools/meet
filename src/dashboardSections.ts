export type DashboardSection = 'meetings' | 'teams' | 'rooms';

const dashboardSections = new Set<DashboardSection>(['meetings', 'teams', 'rooms']);

export function resolveDashboardSection(section: string | undefined): DashboardSection {
  return section && dashboardSections.has(section as DashboardSection)
    ? (section as DashboardSection)
    : 'meetings';
}
