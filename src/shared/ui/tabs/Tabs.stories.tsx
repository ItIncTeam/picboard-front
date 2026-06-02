import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'
import { expect, userEvent, within } from 'storybook/test'

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

export const WithDisabledTab: Story = {
  args: {
    tabs: [
      { value: 'tab1', title: 'Tab 1' },
      { value: 'tab2', title: 'Tab 2' },
      { value: 'tab3', title: 'Tab 3', disabled: true },
    ],
  },
}

export const DarkBackground: Story = {
  decorators: [darkBackgroundDecorator],
}

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('tab', { name: 'Tab 2' }))

    await expect(canvas.getByText('Content 2')).toBeVisible()
  },
}
