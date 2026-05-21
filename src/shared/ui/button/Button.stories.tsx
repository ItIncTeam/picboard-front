import { Button } from './Button'
import { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta = {
  title: 'Shared/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
}

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'Outlined Button',
  },
}

export const TextButton: Story = {
  args: {
    variant: 'textButton',
    children: 'TextButton',
  },
}

export const ButtonAsLink: Story = {
  args: {
    variant: 'primary',
    asChild: true,
    children: <a href={'https://it-incubator.io'}>it-incubator</a>,
  },
}
