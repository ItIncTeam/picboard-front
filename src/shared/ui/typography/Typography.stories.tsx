import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Link } from './Link'
import { Text } from './Text'
import { Title } from './Title'

const meta = {
  title: 'Shared/Typography',
  tags: ['autodocs'],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Title level="h1">Title h1</Title>
      <Title level="h2">Title h2</Title>
      <Title level="h3">Title h3</Title>

      <Text size="xl" weight="medium">
        Text xl medium
      </Text>

      <Text size="lg">Text lg regular</Text>
      <Text size="md">Text md regular</Text>

      <Text size="md" weight="bold">
        Text md bold
      </Text>

      <Text size="sm">Text sm regular</Text>

      <Text size="sm" weight="medium">
        Text sm medium
      </Text>

      <Text size="sm" weight="bold">
        Text sm bold
      </Text>

      <Text as="span" size="xs">
        Text xs regular as span
      </Text>

      <Link href="#">Link md</Link>

      <Link href="#" size="sm">
        Link sm
      </Link>

      <Link href="#" size="xs">
        Link xs
      </Link>
    </div>
  ),
}

export const AsProp: Story = {
  render: () => (
    <Text as="span" size="lg" weight="bold">
      Text rendered as span
    </Text>
  ),
}

export const Margins: Story = {
  render: () => (
    <Title level="h1" ml={10} mt={20}>
      Heading with margins
    </Title>
  ),
}

export const Colors: Story = {
  render: () => (
    <Text color="var(--color-primary)" size="md">
      Colored text
    </Text>
  ),
}
