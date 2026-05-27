import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import '@/app/globals.css'

import enFlag from '@/shared/assets/flags/en.png'
import ruFlag from '@/shared/assets/flags/ru.png'

import type { SelectOption } from './Select'
import { Select } from './index'

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

const countryOptions: SelectOption[] = [
  { value: 'ru', label: 'Russia' },
  { value: 'by', label: 'Belarus' },
  { value: 'kz', label: 'Kazakhstan' },
]

const formOptions: SelectOption[] = [
  { value: 'first', label: 'First option' },
  { value: 'second', label: 'Second option' },
  { value: 'third', label: 'Third option' },
]

const meta = {
  title: 'Shared/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [darkBackgroundDecorator],
  render: (args) => <Select {...args} />,
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof Select>

/** General information: placeholder с формы, без label */
export const Default: Story = {
  args: {
    options: countryOptions,
    placeholder: 'Select your country',
  },
}

export const WithValue: Story = {
  args: {
    options: countryOptions,
    defaultValue: 'ru',
    placeholder: 'Select your country',
  },
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('ru')

    return (
      <Select
        value={value}
        onValueChange={setValue}
        placeholder="Select your country"
        options={countryOptions}
      />
    )
  },
}

export const LongList: Story = {
  args: {
    placeholder: 'Select your country',
    options: Array.from({ length: 12 }, (_, index) => {
      const value = `option-${index + 1}`

      return {
        value,
        label: `Option ${index + 1}`,
      }
    }),
  },
}

export const Disabled: Story = {
  args: {
    options: countryOptions,
    placeholder: 'Select your country',
    disabled: true,
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Country',
    options: countryOptions,
    defaultValue: 'ru',
    placeholder: 'Select your country',
  },
}

export const WithError: Story = {
  args: {
    options: countryOptions,
    placeholder: 'Select your country',
    errorMessage: 'Please select your country',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox')

    await expect(trigger).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByRole('alert')).toHaveTextContent('Please select your country')
  },
}

const languageOptions: SelectOption[] = [
  {
    value: 'en',
    label: 'English11111111111111111111111111111111111111111',
    image: enFlag.src,
  },
  { value: 'ru', label: 'Russian', image: ruFlag.src },
]

/** Header i18n: options с image, controlled, ширина через родителя */
export const HeaderLanguage: Story = {
  decorators: [darkBackgroundDecorator],
  render: () => {
    const [locale, setLocale] = useState('en')

    return (
      <div style={{ width: 163 }}>
        <Select options={languageOptions} value={locale} onValueChange={setLocale} />
      </div>
    )
  },
}

export const UncontrolledWithImage: Story = {
  decorators: [darkBackgroundDecorator],
  render: () => (
    <div style={{ width: 163 }}>
      <Select defaultValue="ru" options={languageOptions} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox')

    await expect(trigger).toHaveTextContent('Russian')
    await expect(trigger.querySelector('img')).not.toBeNull()

    await userEvent.click(trigger)

    const listbox = within(document.body).getByRole('listbox')
    const englishOption = within(listbox).getByRole('option', {
      name: /English11111111111111111111111111111111111111111/,
    })

    await userEvent.click(englishOption)

    await expect(trigger).toHaveTextContent(/English11111111111111111111111111111111111111111/)
    await expect(trigger.querySelector('img')).not.toBeNull()
  },
}

export const OpensAndSelectsOption: Story = {
  args: {
    options: formOptions,
    placeholder: 'Select your country',
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

export const KeyboardNavigation: Story = {
  args: {
    options: formOptions,
    placeholder: 'Select your country',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.tab()
    await expect(canvas.getByRole('combobox')).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')

    await expect(canvas.getByRole('combobox')).toHaveTextContent('First option')
  },
}
