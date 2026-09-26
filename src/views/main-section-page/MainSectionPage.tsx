'use client'

import { useI18n } from '@/shared/lib/i18n'
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

type MainSectionPageProps = {
  section: MainSection
}

export function MainSectionPage({ section }: MainSectionPageProps) {
  const { t } = useI18n()
  const mainSectionTitles: Record<MainSection, string> = {
    'account-settings': t.routePlaceholder.mainSections.accountSettings,
    'create-post': t.routePlaceholder.mainSections.createPost,
    favorites: t.routePlaceholder.mainSections.favorites,
    'notifications-settings': t.routePlaceholder.mainSections.notificationSettings,
    'post-details': t.routePlaceholder.mainSections.postDetails,
    'profile-settings': t.routePlaceholder.mainSections.profileSettings,
    search: t.routePlaceholder.mainSections.search,
    'settings-devices': t.routePlaceholder.mainSections.settingsDevices,
    statistics: t.routePlaceholder.mainSections.statistics,
  }

  return (
    <RoutePlaceholder
      title={mainSectionTitles[section]}
      description={t.routePlaceholder.protectedDescription}
      figmaNode="1:12"
      routes={[
        '/feed',
        '/search',
        '/favorites',
        '/statistics',
        '/settings/profile',
        '/settings/account',
        '/settings/notifications',
        '/settings/devices',
      ]}
    />
  )
}
