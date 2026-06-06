'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import clsx from 'clsx'
import { type ComponentPropsWithoutRef, type ReactNode } from 'react'

import styles from './tabs.module.css'

export type TabType = {
  disabled?: boolean
  title: string
  value: string
}

export type TabsProps = {
  children?: ReactNode
  tabs: TabType[]
} & ComponentPropsWithoutRef<typeof RadixTabs.Root>

export const Tabs = ({ children, className, tabs, ...rest }: TabsProps) => {
  return (
    <RadixTabs.Root className={clsx(styles.root, className)} {...rest}>
      <RadixTabs.List className={styles.list}>
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            className={styles.trigger}
            disabled={tab.disabled}
            key={tab.value}
            value={tab.value}
          >
            {tab.title}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {children}
    </RadixTabs.Root>
  )
}

export type TabContentProps = {
  children: ReactNode
} & ComponentPropsWithoutRef<typeof RadixTabs.Content>

export const TabContent = ({ children, className, ...rest }: TabContentProps) => {
  return (
    <RadixTabs.Content className={clsx(styles.content, className)} {...rest}>
      {children}
    </RadixTabs.Content>
  )
}
