import { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from '@/shared/ui/input/Input'
import openEye from '@/shared/assets/icon/openEye.svg'
import closeEye from '@/shared/assets/icon/closeEye.svg'

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
    Icon: closeEye,
  },
}

export const DefaultIcon: Story = {
  args: {
    variant: 'defaultIcon',
    placeholder: 'DefaultIcon',
    type: 'text',
    label: 'label',
    Icon: openEye,
  },
}

export const DefaultInput: Story = {
  args: {
    variant: 'default',
    placeholder: 'defaultInput',
  },
}
