import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { useToast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { ToastProvider } from '@/shared/ui/toast'

import styles from './toast.stories.module.css'

const ToastDemo = () => {
  const toast = useToast()

  return (
    <div className={styles.storyGroup}>
      <Button onClick={() => toast.success('Profile saved successfully.')}>Success</Button>
      <Button onClick={() => toast.error('Invalid email or password.')}>Error</Button>
      <Button onClick={() => toast.info('New updates are available.')}>Info</Button>
      <Button onClick={() => toast.warning('Your session will expire soon.')}>Warning</Button>
    </div>
  )
}

const meta = {
  title: 'Shared/Toast',
  component: ToastDemo,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastDemo>

export default meta

type Story = StoryObj<typeof ToastDemo>

export const Default: Story = {}
