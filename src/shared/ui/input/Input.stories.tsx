import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CloseEyeIcon, OpenEyeIcon } from '@/shared/assets'
import { Input } from '@/shared/ui/input/Input'

import s from './Input.stories.module.css'

const meta = {
  title: 'Shared/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof Input>

export const DefaultInput: Story = {
  args: {
    variant: 'default',
    label: 'Email',
    placeholder: 'Epam@epam.com',
  },
}

export const ActiveInput: Story = {
  args: {
    variant: 'default',
    className: s.activeInput,
    label: 'Email',
    placeholder: 'Epam@epam.com',
    defaultValue: '|',
  },
}

export const ErrorInput: Story = {
  args: {
    variant: 'default',
    label: 'Email',
    placeholder: 'Epam@epam.com',
    error: 'Error text',
  },
}

export const HoverInput: Story = {
  args: {
    variant: 'default',
    className: s.hoverInput,
    label: 'Email',
    placeholder: 'Epam@epam.com',
  },
}

export const FocusInput: Story = {
  args: {
    variant: 'default',
    className: s.focusInput,
    label: 'Email',
    placeholder: 'Epam@epam.com',
  },
}

export const DisabledInput: Story = {
  args: {
    variant: 'default',
    label: 'Email',
    placeholder: 'Epam@epam.com',
    disabled: true,
  },
}

export const DefaultIcon: Story = {
  args: {
    variant: 'defaultIcon',
    placeholder: 'DefaultIcon',
    type: 'text',
    label: 'label',
    Icon: OpenEyeIcon,
  },
}

export const ActiveIcon: Story = {
  args: {
    variant: 'defaultIcon',
    className: s.activeInput,
    placeholder: 'Epam@epam.com',
    defaultValue: 'Epam@epam.com',
    type: 'text',
    label: 'Email',
    Icon: CloseEyeIcon,
  },
}

export const ErrorIcon: Story = {
  args: {
    variant: 'defaultIcon',
    placeholder: 'Epam@epam.com',
    defaultValue: 'Epam@epam.com',
    type: 'text',
    label: 'Email',
    error: 'Error text',
    Icon: CloseEyeIcon,
  },
}

export const HoverIcon: Story = {
  args: {
    variant: 'defaultIcon',
    className: s.hoverInput,
    placeholder: 'Epam@epam.com',
    type: 'text',
    label: 'Email',
    Icon: CloseEyeIcon,
  },
}

export const FocusIcon: Story = {
  args: {
    variant: 'defaultIcon',
    className: s.focusInput,
    placeholder: 'Epam@epam.com',
    type: 'text',
    label: 'Email',
    Icon: CloseEyeIcon,
  },
}

export const DisabledIcon: Story = {
  args: {
    variant: 'defaultIcon',
    placeholder: 'Epam@epam.com',
    type: 'text',
    label: 'Email',
    disabled: true,
    Icon: OpenEyeIcon,
  },
}

export const SearchDefault: Story = {
  args: {
    variant: 'search',
    placeholder: 'Input search',
  },
}

export const SearchActive: Story = {
  args: {
    variant: 'search',
    className: s.activeInput,
    placeholder: 'Input search',
  },
}

export const SearchError: Story = {
  args: {
    variant: 'search',
    placeholder: 'Input search',
    error: 'Error text',
  },
}

export const SearchHover: Story = {
  args: {
    variant: 'search',
    className: s.hoverInput,
    placeholder: 'Input search',
  },
}

export const SearchFocus: Story = {
  args: {
    variant: 'search',
    className: s.focusInput,
    placeholder: 'Input search',
  },
}

export const SearchDisabled: Story = {
  args: {
    variant: 'search',
    placeholder: 'Input search',
    disabled: true,
  },
}
