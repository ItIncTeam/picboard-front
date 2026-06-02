import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import '@/app/globals.css'

import { TabContent, Tabs } from './Tabs'

const darkBackgroundDecorator = (Story: () => ReactNode) => (
  <div
    style={{
      padding: 24,
      background: 'var(--color-dark-700)',
    }}
  >
    <Story />
  </div>
)

const constrainedWidthDecorator = (Story: () => ReactNode) => (
  <div style={{ maxWidth: 360 }}>
    <Story />
  </div>
)

const createTabContent = (tabs: Array<{ title: string; value: string }>) => (
  <>
    {tabs.map((tab) => (
      <TabContent key={tab.value} value={tab.value}>
        {tab.title} content
      </TabContent>
    ))}
  </>
)

const meta = {
  title: 'Shared/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: {
    tabs: [
      { value: 'tab1', title: 'Tab 1' },
      { value: 'tab2', title: 'Tab 2' },
      { value: 'tab3', title: 'Tab 3' },
    ],
    defaultValue: 'tab1',
    children: (
      <>
        <TabContent value="tab1">Content 1</TabContent>
        <TabContent value="tab2">Content 2</TabContent>
        <TabContent value="tab3">Content 3</TabContent>
      </>
    ),
  },
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    tabs: [
      { value: 'tab1', title: 'Tab 1' },
      { value: 'tab2', title: 'Tab 2' },
      { value: 'tab3', title: 'Tab 3', disabled: true },
    ],
  },
}

export const LongLabels: Story = {
  decorators: [constrainedWidthDecorator],
  args: {
    tabs: [
      { value: 'profile', title: 'Profile information' },
      { value: 'security', title: 'Security and login settings' },
      { value: 'notifications', title: 'Notification preferences' },
    ],
    defaultValue: 'profile',
    children: (
      <>
        <TabContent value="profile">Profile information content</TabContent>
        <TabContent value="security">Security and login settings content</TabContent>
        <TabContent value="notifications">Notification preferences content</TabContent>
      </>
    ),
  },
}

const manyTabs = [
  { value: 'tab1', title: 'Tab 1' },
  { value: 'tab2', title: 'Tab 2' },
  { value: 'tab3', title: 'Tab 3' },
  { value: 'tab4', title: 'Tab 4' },
  { value: 'tab5', title: 'Tab 5' },
  { value: 'tab6', title: 'Tab 6' },
  { value: 'tab7', title: 'Tab 7' },
  { value: 'tab8', title: 'Tab 8' },
]

export const ManyTabsOverflow: Story = {
  decorators: [constrainedWidthDecorator],
  args: {
    tabs: manyTabs,
    defaultValue: 'tab1',
    children: createTabContent(manyTabs),
  },
}

const ControlledTabs = () => {
  const [value, setValue] = useState('tab1')

  return (
    <Tabs
      tabs={[
        { value: 'tab1', title: 'Tab 1' },
        { value: 'tab2', title: 'Tab 2' },
        { value: 'tab3', title: 'Tab 3' },
      ]}
      value={value}
      onValueChange={setValue}
    >
      <TabContent value="tab1">Content 1</TabContent>
      <TabContent value="tab2">Content 2</TabContent>
      <TabContent value="tab3">Content 3</TabContent>
    </Tabs>
  )
}

export const Controlled: Story = {
  render: () => <ControlledTabs />,
}

export const DarkBackground: Story = {
  decorators: [darkBackgroundDecorator],
}

export const HoverAndActiveState: Story = {
  args: {
    defaultValue: 'tab2',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const activeTab = canvas.getByRole('tab', { name: 'Tab 2' })
    const hoverTab = canvas.getByRole('tab', { name: 'Tab 3' })

    await expect(activeTab).toHaveAttribute('data-state', 'active')
    await userEvent.hover(hoverTab)
    await expect(hoverTab).toHaveAttribute('data-state', 'inactive')
  },
}

export const FocusState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const firstTab = canvas.getByRole('tab', { name: 'Tab 1' })
    const secondTab = canvas.getByRole('tab', { name: 'Tab 2' })

    await userEvent.tab()
    await expect(firstTab).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(secondTab).toHaveFocus())
  },
}

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('tab', { name: 'Tab 2' }))

    await expect(canvas.getByText('Content 2')).toBeVisible()
  },
}
