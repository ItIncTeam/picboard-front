'use client'

import Link from 'next/link'

import { useI18n } from '@/shared/lib/i18n'

import styles from './route-placeholder.module.css'

type RoutePlaceholderProps = {
  description: string
  figmaNode?: string
  routes?: string[]
  title: string
}

const isDynamicRouteTemplate = (route: string) => route.includes('[') || route.includes(']')

export function RoutePlaceholder({ description, figmaNode, routes, title }: RoutePlaceholderProps) {
  const { t } = useI18n()

  return (
    <div className={styles.root}>
      <section className={styles.content} aria-labelledby="page-title">
        <p className={styles.eyebrow}>{t.routePlaceholder.eyebrow}</p>
        <h1 id="page-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.description}>{description}</p>

        {figmaNode && (
          <p className={styles.meta}>
            {t.routePlaceholder.figmaNode} <span>{figmaNode}</span>
          </p>
        )}

        {routes && routes.length > 0 && (
          <nav aria-label={t.routePlaceholder.relatedRoutes}>
            <ul className={styles.routes}>
              {routes.map((route) => {
                const isDynamicRoute = isDynamicRouteTemplate(route)

                return (
                  <li key={route}>
                    {isDynamicRoute ? (
                      <span className={styles.routeLink}>{route}</span>
                    ) : (
                      <Link className={styles.routeLink} href={route}>
                        {route}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </section>
    </div>
  )
}
