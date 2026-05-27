import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState, type ReactNode } from 'react'
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

const groupOptions = [
  { value: 'first', label: 'First option' },
  { value: 'second', label: 'Second option' },
  { value: 'third', label: 'Third option' },
] as const

export const Group: Story = {
  render: () => <RadioGroup options={groupOptions} defaultValue="first" />,
}

export const GroupWithLabel: Story = {
  render: () => <RadioGroup label="Account type" options={groupOptions} defaultValue="first" />,
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('first')

    return <RadioGroup options={groupOptions} value={value} onValueChange={setValue} />
  },
}

export const GroupWithComposition: Story = {
  render: () => (
    <RadioGroup defaultValue="first">
      <RadioGroupItem value="first" label="First option" />
      <RadioGroupItem value="second" label="Second option" />
      <RadioGroupItem value="third" label="Third option" />
    </RadioGroup>
  ),
}

export const WithError: Story = {
  render: () => <RadioGroup options={groupOptions} errorMessage="Please select an option" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = canvas.getByRole('radiogroup')

    await expect(group).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByRole('alert')).toHaveTextContent('Please select an option')
  },
}

export const SelectsOption: Story = {
  render: () => <RadioGroup options={groupOptions.slice(0, 2)} defaultValue="first" />,
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
  render: () => <RadioGroup options={groupOptions} defaultValue="first" />,
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
