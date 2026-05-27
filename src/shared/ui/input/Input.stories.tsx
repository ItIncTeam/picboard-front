import { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from '@/shared/ui/input/Input'

const meta = {
  title: 'Shared/Button',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Primary Button',
  },
}
