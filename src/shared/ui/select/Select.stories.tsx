import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import '@/app/globals.css'

import { EnFlagImage, RuFlagImage } from '@/shared/assets'

import type { SelectOption } from './Select'
import { Select } from './index'

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

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'first', label: 'First option' },
      { value: 'second', label: 'Second option', disabled: true },
      { value: 'third', label: 'Third option' },
    ],
    placeholder: 'Select option',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox')

    await userEvent.click(trigger)

    const listbox = within(document.body).getByRole('listbox')
    const disabledOption = within(listbox).getByRole('option', { name: 'Second option' })

    await expect(disabledOption).toHaveAttribute('data-disabled', '')
    await userEvent.click(disabledOption)

    await expect(trigger).not.toHaveTextContent('Second option')
    await expect(trigger).toHaveTextContent('Select option')
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
    label: 'English',
    image: EnFlagImage.src,
  },
  { value: 'ru', label: 'Russian', image: RuFlagImage.src },
]

/** Header i18n: options с image, controlled, ширина через родителя */
export const HeaderLanguage: Story = {
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
      name: 'English',
    })

    await userEvent.click(englishOption)

    await expect(trigger).toHaveTextContent('English')
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
