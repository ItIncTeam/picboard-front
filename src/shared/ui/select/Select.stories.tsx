import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import { selectHeaderRootClassName, SelectItem } from './index'
import { Select } from './Select'

const defaultOptions = (
  <>
    <SelectItem value="first">Select-box</SelectItem>
    <SelectItem value="second">Select-box</SelectItem>
    <SelectItem value="third">Select-box</SelectItem>
  </>
)

const meta = {
  title: 'Shared/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  render: (args) => <Select {...args}>{defaultOptions}</Select>,
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof Select>

export const Default: Story = {
  args: {
    placeholder: 'Select-box',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Select-box',
    placeholder: 'Select-box',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'first',
    placeholder: 'Select-box',
  },
}

export const WithLabelAndValue: Story = {
  args: {
    label: 'Select-box',
    defaultValue: 'first',
    placeholder: 'Select-box',
  },
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('first')

    return (
      <Select value={value} onValueChange={setValue} label="Select-box" placeholder="Select-box">
        <SelectItem value="first">First option</SelectItem>
        <SelectItem value="second">Second option</SelectItem>
        <SelectItem value="third">Third option</SelectItem>
      </Select>
    )
  },
}

/** Scrollable viewport when there are more than six options */
export const LongList: Story = {
  render: (args) => (
    <Select {...args}>
      {Array.from({ length: 12 }, (_, index) => {
        const value = `option-${index + 1}`

        return (
          <SelectItem key={value} value={value}>
            Option {index + 1}
          </SelectItem>
        )
      })}
    </Select>
  ),
  args: {
    label: 'Select-box',
    placeholder: 'Select-box',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Select-box',
    placeholder: 'Select-box',
    disabled: true,
  },
}

const headerFlagPlaceholder = (
  <span
    aria-hidden
    style={{
      display: 'block',
      width: 24,
      height: 16,
      borderRadius: 2,
      background: 'linear-gradient(180deg, #012169 33%, #fff 33% 66%, #c8102e 66%)',
    }}
  />
)

const languageOptions = (
  <>
    <SelectItem value="en">English</SelectItem>
    <SelectItem value="ru">Russian</SelectItem>
  </>
)

/** Header i18n: className={selectHeaderRootClassName} + startAdornment */
export const HeaderLanguage: Story = {
  render: (args) => <Select {...args}>{languageOptions}</Select>,
  args: {
    className: selectHeaderRootClassName,
    startAdornment: headerFlagPlaceholder,
    defaultValue: 'en',
  },
}

export const OpensAndSelectsOption: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectItem value="first">First option</SelectItem>
      <SelectItem value="second">Second option</SelectItem>
      <SelectItem value="third">Third option</SelectItem>
    </Select>
  ),
  args: {
    placeholder: 'Select-box',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox')

    await userEvent.click(trigger)

    const listbox = within(document.body).getByRole('listbox')
    const secondOption = within(listbox).getByRole('option', { name: 'Second option' })

    await userEvent.click(secondOption)

    await expect(trigger).toHaveTextContent('Second option')
  },
}
