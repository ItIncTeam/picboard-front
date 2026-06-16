import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import '@/app/globals.css'

import { Pagination } from './Pagination'

const meta = {
  title: 'Shared/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>

export default meta

type Story = StoryObj<typeof Pagination>

const PaginationState = ({
  initialPage = 1,
  initialPageSize = 100,
  totalPages = 55,
}: {
  initialPage?: number
  initialPageSize?: number
  totalPages?: number
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      onPageChangeAction={setCurrentPage}
      onPageSizeChangeAction={setPageSize}
    />
  )
}

export const Default: Story = {
  render: () => <PaginationState />,
}

export const MiddlePage: Story = {
  render: () => <PaginationState initialPage={7} />,
}

export const FewPages: Story = {
  render: () => <PaginationState initialPage={3} totalPages={5} />,
}

export const Disabled: Story = {
  args: {
    currentPage: 7,
    totalPages: 55,
    pageSize: 100,
    disabled: true,
    onPageChangeAction: () => {},
    onPageSizeChangeAction: () => {},
  },
}

export const WithoutPageSizeSelect: Story = {
  args: {
    currentPage: 7,
    totalPages: 55,
    showPageSizeSelect: false,
    onPageChangeAction: () => {},
  },
}

export const OpensPageSizeSelect: Story = {
  render: () => <PaginationState initialPage={7} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: 'Items per page' })

    await userEvent.click(trigger)

    const listbox = within(document.body).getByRole('listbox')

    await expect(within(listbox).getByRole('option', { name: '10' })).toBeVisible()
    await expect(within(listbox).getByRole('option', { name: '100' })).toBeVisible()
  },
}

export const ChangesPage: Story = {
  render: () => <PaginationState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Go to page 3' }))

    await expect(canvas.getByRole('button', { name: 'Go to page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}
