import { Meta } from '@storybook/nextjs-vite'

import { TabContent, Tabs } from './Tabs'

export default {
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
} as Meta<typeof Tabs>

export const Default = {}

export const WithDisabledTab = {
  args: {
    tabs: [
      { value: 'tab1', title: 'Tab 1' },
      { value: 'tab2', title: 'Tab 2' },
      { value: 'tab3', title: 'Tab 3', disabled: true },
    ],
  },
}
