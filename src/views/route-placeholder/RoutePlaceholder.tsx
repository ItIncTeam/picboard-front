import styles from './route-placeholder.module.css'

type RoutePlaceholderProps = {
  description: string
  figmaNode?: string
  routes?: string[]
  title: string
}

export function RoutePlaceholder({ description, figmaNode, routes, title }: RoutePlaceholderProps) {
  return (
    <main className={styles.root}>
      <section className={styles.content} aria-labelledby="page-title">
        <p className={styles.eyebrow}>Route stub</p>
        <h1 id="page-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.description}>{description}</p>

        {figmaNode && (
          <p className={styles.meta}>
            Figma node: <span>{figmaNode}</span>
          </p>
        )}

        {routes && routes.length > 0 && (
          <ul className={styles.routes} aria-label="Related routes">
            {routes.map((route) => (
              <li key={route}>{route}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
