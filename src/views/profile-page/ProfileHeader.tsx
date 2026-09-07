'use client'

import Image from 'next/image'
import Link from 'next/link'

import { PersonIcon } from '@/shared/assets'
import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'

import styles from './profile-page.module.css'

export type ProfileHeaderData = {
  avatarUrl: string | null
  bio: string | null
  displayName: string | null
  followersCount: number
  followingCount: number
  publicationsCount: number
  username: string
}

type ProfileHeaderProps = {
  data: ProfileHeaderData
  isOwner: boolean
}

export function ProfileHeader({ data, isOwner }: ProfileHeaderProps) {
  const { t } = useI18n()
  const avatarLabel = `${data.username} ${t.profile.avatarSuffix}`

  return (
    <header className={styles.profileHeader}>
      <div className={styles.avatar}>
        {data.avatarUrl ? (
          <Image
            alt={avatarLabel}
            className={styles.avatarImage}
            fill
            sizes="(max-width: 480px) 72px, (max-width: 720px) 96px, 192px"
            src={data.avatarUrl}
            unoptimized
          />
        ) : (
          <PersonIcon
            aria-label={avatarLabel}
            className={styles.avatarIcon}
            focusable="false"
            role="img"
          />
        )}
      </div>

      <div className={styles.profileInfo}>
        <div className={styles.identityRow}>
          <div>
            <h1 className={styles.username} id="profile-title">
              {data.username}
            </h1>
            {data.displayName && <p className={styles.displayName}>{data.displayName}</p>}
          </div>

          {isOwner && (
            <Button asChild variant="outlined">
              <Link href="/settings/profile">{t.profile.settings}</Link>
            </Button>
          )}
        </div>

        <ul className={styles.counters}>
          <li>
            <strong>{data.publicationsCount}</strong>
            <span>{t.profile.publications}</span>
          </li>
          <li>
            <strong>{data.followersCount}</strong>
            <span>{t.profile.followers}</span>
          </li>
          <li>
            <strong>{data.followingCount}</strong>
            <span>{t.profile.following}</span>
          </li>
        </ul>

        <div className={styles.about}>
          <h2 className={styles.aboutTitle}>{t.profile.about}</h2>
          <p className={styles.bio}>{data.bio || t.profile.noInformation}</p>
        </div>
      </div>
    </header>
  )
}
