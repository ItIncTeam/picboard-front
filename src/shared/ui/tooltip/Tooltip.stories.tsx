import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '@/shared/ui/button'

import { Tooltip } from './Tooltip'
import { TooltipProvider } from './TooltipProvider'

const TooltipDemo = () => {
  return (
    <Tooltip content="Tooltip content" side="top">
      <Button>Hover or focus</Button>
    </Tooltip>
  )
}

const meta = {
  title: 'Shared/Tooltip',
  component: TooltipDemo,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TooltipDemo>

export default meta

type Story = StoryObj<typeof TooltipDemo>

export const Default: Story = {}
