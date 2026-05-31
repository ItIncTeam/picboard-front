import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CloseEyeIcon, OpenEyeIcon } from '@/shared/assets'
import { Input } from '@/shared/ui/input/Input'

const meta = {
  title: 'Shared/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof Input>

export const ErrorInput: Story = {
  args: {
    variant: 'defaultIcon',
    placeholder: 'errorInput',
    type: 'password',
    label: 'label',
    error: 'error',
    Icon: CloseEyeIcon,
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

export const DefaultInput: Story = {
  args: {
    variant: 'default',
    placeholder: 'defaultInput',
  },
}
