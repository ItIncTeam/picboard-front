import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TextArea } from '@/shared/ui/text-area/TextArea'

const meta = {
  title: 'Shared/TextArea',
  component: TextArea,
  tags: ['autodocs'],
} satisfies Meta<typeof TextArea>

export default meta
type Story = StoryObj<typeof TextArea>

export const DefaultTextArea: Story = {
  args: {
    placeholder: 'DefaultTextArea',
    label: 'label',
  },
}

export const ErrorTextArea: Story = {
  args: {
    placeholder: 'errorTextArea',
    label: 'label',
    error: 'error',
  },
}

export const DisableTextArea: Story = {
  args: {
    placeholder: 'disableTextArea',
    label: 'disabled',
    disabled: true,
  },
}
