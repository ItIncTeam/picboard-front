import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import '@/app/globals.css'

import { RadioGroup } from './RadioGroup'
import { RadioGroupItem } from './RadioGroupItem'
import type { RadioGroupItemProps } from './RadioGroupItem'

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

const renderSingleItem = (defaultValue?: string) => {
  const SingleItemStory = (args: RadioGroupItemProps) => (
    <RadioGroup defaultValue={defaultValue}>
      <RadioGroupItem {...args} />
    </RadioGroup>
  )
  SingleItemStory.displayName = 'RadioGroupSingleItemStory'
  return SingleItemStory
}

const meta = {
  title: 'Shared/RadioGroup',
  component: RadioGroupItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [darkBackgroundDecorator],
} satisfies Meta<typeof RadioGroupItem>

export default meta

type Story = StoryObj<typeof RadioGroupItem>

export const Unchecked: Story = {
  render: renderSingleItem(),
  args: {
    value: 'option',
  },
}

export const Checked: Story = {
  render: renderSingleItem('option'),
  args: {
    value: 'option',
  },
}

export const WithLabel: Story = {
  render: renderSingleItem(),
  args: {
    value: 'option',
    label: 'RadioGroup',
  },
}

export const DisabledUnchecked: Story = {
  render: renderSingleItem(),
  args: {
    value: 'option',
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  render: renderSingleItem('option'),
  args: {
    value: 'option',
    disabled: true,
  },
}

export const DisabledWithLabel: Story = {
  render: renderSingleItem('option'),
  args: {
    value: 'option',
    label: 'RadioGroup',
    disabled: true,
  },
}

export const Group: Story = {
  render: () => (
    <RadioGroup defaultValue="first">
      <RadioGroupItem value="first" label="First option" />
      <RadioGroupItem value="second" label="Second option" />
      <RadioGroupItem value="third" label="Third option" />
    </RadioGroup>
  ),
}

export const SelectsOption: Story = {
  render: () => (
    <RadioGroup defaultValue="first">
      <RadioGroupItem value="first" label="First option" />
      <RadioGroupItem value="second" label="Second option" />
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const firstOption = canvas.getByRole('radio', { name: 'First option' })
    const secondOption = canvas.getByRole('radio', { name: 'Second option' })

    await expect(firstOption).toBeChecked()
    await expect(secondOption).not.toBeChecked()

    await userEvent.click(secondOption)

    await expect(secondOption).toBeChecked()
    await expect(firstOption).not.toBeChecked()
  },
}

export const KeyboardNavigation: Story = {
  render: () => (
    <RadioGroup defaultValue="first">
      <RadioGroupItem value="first" label="First option" />
      <RadioGroupItem value="second" label="Second option" />
      <RadioGroupItem value="third" label="Third option" />
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const firstOption = canvas.getByRole('radio', { name: 'First option' })
    const secondOption = canvas.getByRole('radio', { name: 'Second option' })

    firstOption.focus()
    await userEvent.keyboard('{ArrowDown}')

    await expect(secondOption).toBeChecked()
    await expect(firstOption).not.toBeChecked()
  },
}
