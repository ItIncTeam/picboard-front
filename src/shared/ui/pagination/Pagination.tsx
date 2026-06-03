'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'

import { cn } from '@/shared/lib/cn'

import styles from './pagination.module.css'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const
const MIN_VISIBLE_PAGE_COUNT = 7

type EllipsisItem = 'ellipsis-start' | 'ellipsis-end'
type PageItem = number | EllipsisItem

export type PaginationProps = {
  currentPage: number
  totalPages: number
  pageSize?: number
  pageSizeOptions?: ReadonlyArray<number>
  disabled?: boolean
  className?: string
  ariaLabel?: string
  showPageSizeSelect?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

const clampPage = (page: number, totalPages: number): number => {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1))
}

const getPageItems = (currentPage: number, totalPages: number): PageItem[] => {
  if (totalPages <= MIN_VISIBLE_PAGE_COUNT) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis-start',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [
    1,
    'ellipsis-start',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis-end',
    totalPages,
  ]
}

const isPageNumber = (item: PageItem): item is number => {
  return typeof item === 'number'
}

export const Pagination = ({
  currentPage,
  totalPages,
  pageSize = 100,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  disabled = false,
  className,
  ariaLabel = 'Pagination',
  showPageSizeSelect = true,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) => {
  const safeTotalPages = Math.max(totalPages, 1)
  const activePage = clampPage(currentPage, safeTotalPages)
  const pageItems = getPageItems(activePage, safeTotalPages)
  const isPreviousDisabled = disabled || activePage === 1
  const isNextDisabled = disabled || activePage === safeTotalPages
  const isPageSizeSelectDisabled = disabled || !onPageSizeChange

  const handlePageChange = (page: number): void => {
    const nextPage = clampPage(page, safeTotalPages)

    if (disabled || nextPage === activePage) {
      return
    }

    onPageChange(nextPage)
  }

  const handlePageSizeChange = (nextPageSize: string): void => {
    onPageSizeChange?.(Number(nextPageSize))
  }

  return (
    <nav className={cn(styles.pagination, className)} aria-label={ariaLabel}>
      <button
        className={cn(styles.pagination__control, styles.pagination__arrow)}
        type="button"
        disabled={isPreviousDisabled}
        aria-label="Go to previous page"
        onClick={() => handlePageChange(activePage - 1)}
      >
        <ChevronLeftIcon aria-hidden />
      </button>

      <ol className={styles.pagination__list}>
        {pageItems.map((item) => {
          if (!isPageNumber(item)) {
            return (
              <li key={item} className={styles.pagination__item}>
                <span className={styles.pagination__ellipsis} aria-hidden>
                  ...
                </span>
              </li>
            )
          }

          const isCurrent = item === activePage

          return (
            <li key={item} className={styles.pagination__item}>
              <button
                className={cn(styles.pagination__control, styles.pagination__page)}
                type="button"
                disabled={disabled}
                aria-label={`Go to page ${item}`}
                aria-current={isCurrent ? 'page' : undefined}
                data-active={isCurrent || undefined}
                onClick={() => handlePageChange(item)}
              >
                {item}
              </button>
            </li>
          )
        })}
      </ol>

      <button
        className={cn(styles.pagination__control, styles.pagination__arrow)}
        type="button"
        disabled={isNextDisabled}
        aria-label="Go to next page"
        onClick={() => handlePageChange(activePage + 1)}
      >
        <ChevronRightIcon aria-hidden />
      </button>

      {showPageSizeSelect ? (
        <div className={styles.pagination__pageSize}>
          <span className={styles.pagination__pageSizeText}>Show</span>
          <SelectPrimitive.Root
            value={String(pageSize)}
            disabled={isPageSizeSelectDisabled}
            onValueChange={handlePageSizeChange}
          >
            <SelectPrimitive.Trigger
              className={styles.pagination__selectTrigger}
              aria-label="Items per page"
            >
              <SelectPrimitive.Value />
              <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className={styles.pagination__selectIcon} aria-hidden />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
                className={styles.pagination__selectContent}
                position="popper"
                sideOffset={0}
                align="start"
              >
                <SelectPrimitive.Viewport>
                  {pageSizeOptions.map((option) => (
                    <SelectPrimitive.Item
                      key={option}
                      className={styles.pagination__selectItem}
                      value={String(option)}
                    >
                      <SelectPrimitive.ItemText>{option}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
          <span className={styles.pagination__pageSizeText}>on page</span>
        </div>
      ) : null}
    </nav>
  )
}
