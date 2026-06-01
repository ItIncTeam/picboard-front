import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import { Checkbox } from './Checkbox'

const meta = {
  title: 'Shared/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof Checkbox>

export const Unchecked: Story = {}

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
}

export const WithLabel: Story = {
  args: {
    label: 'I agree to the Terms of Service',
  },
}

export const DisabledUnchecked: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
}

export const DisabledWithLabel: Story = {
  args: {
    label: 'Disabled option',
    disabled: true,
    defaultChecked: true,
  },
}

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)

    return (
      <Checkbox
        label="I agree to the Terms of Service"
        checked={checked}
        onCheckedChange={(next) => setChecked(next === true)}
      />
    )
  },
}

export const KeyboardToggle: Story = {
  args: {
    label: 'I agree to the Terms of Service',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox')

    checkbox.focus()
    await userEvent.keyboard(' ')

    await expect(checkbox).toBeChecked()
  },
}

export const WithError: Story = {
  args: {
    label: 'I agree to the Terms of Service',
    errorMessage: 'You must accept the terms',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox')

    await expect(checkbox).toHaveAttribute('aria-invalid', 'true')
  },
}
