import { RoutePlaceholder } from '@/views/route-placeholder'

type MainSection =
  | 'account-settings'
  | 'create-post'
  | 'favorites'
  | 'notifications-settings'
  | 'post-details'
  | 'profile-settings'
  | 'search'
  | 'settings-devices'
  | 'statistics'

const mainSectionTitles: Record<MainSection, string> = {
  'account-settings': 'Account settings',
  'create-post': 'Create post',
  favorites: 'Favorites',
  'notifications-settings': 'Notification settings',
  'post-details': 'Post details',
  'profile-settings': 'Profile settings',
  search: 'Search',
  'settings-devices': 'Settings devices',
  statistics: 'Statistics',
}

type MainSectionPageProps = {
  section: MainSection
}

export function MainSectionPage({ section }: MainSectionPageProps) {
  return (
    <RoutePlaceholder
      title={mainSectionTitles[section]}
      description="Protected application route from the WebApp / UI Figma section."
      figmaNode="1:12"
      routes={[
        '/[locale]/feed',
        '/[locale]/search',
        '/[locale]/favorites',
        '/[locale]/statistics',
        '/[locale]/settings/profile',
        '/[locale]/settings/account',
        '/[locale]/settings/notifications',
        '/[locale]/settings/devices',
      ]}
    />
  )
}
