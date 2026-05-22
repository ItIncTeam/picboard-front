'use client'

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import clsx from 'clsx'
import { ComponentPropsWithoutRef, useMemo, useState } from 'react'

import s from './date-picker.module.css'

type DatePickerMode = 'single' | 'range'

type DateRangeValue = {
  from: Date | null
  to: Date | null
}

type Props = {
  label?: string
  mode?: DatePickerMode
  value?: Date | DateRangeValue | null
  defaultValue?: Date | DateRangeValue | null
  defaultOpen?: boolean
  disabled?: boolean
  errorMessage?: string
  onValueChange?: (value: Date | DateRangeValue) => void
} & Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>

type CalendarDay = {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

const defaultSingleDate = new Date(2023, 10, 11)

const defaultRangeValue: DateRangeValue = {
  from: new Date(2023, 9, 28),
  to: new Date(2023, 10, 10),
}

export const DatePicker = ({
  label,
  mode = 'single',
  value,
  defaultValue,
  defaultOpen = false,
  disabled = false,
  errorMessage,
  onValueChange,
  className,
  ...rest
}: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const fallbackValue = mode === 'range' ? defaultRangeValue : defaultSingleDate
  const [uncontrolledValue, setUncontrolledValue] = useState<Date | DateRangeValue | null>(
    defaultValue ?? fallbackValue,
  )
  const selectedValue = value === undefined ? uncontrolledValue : value
  const monthDate = getMonthDate(selectedValue)
  const [visibleMonth, setVisibleMonth] = useState(monthDate)

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth])
  const displayValue = getDisplayValue(selectedValue, mode)
  const resolvedLabel = label ?? (mode === 'range' ? 'Date range' : 'Date')

  const handlePreviousMonth = (): void => {
    setVisibleMonth((currentMonth) => addMonths(currentMonth, -1))
  }

  const handleNextMonth = (): void => {
    setVisibleMonth((currentMonth) => addMonths(currentMonth, 1))
  }

  const handleSelectDay = (date: Date): void => {
    const nextValue = getNextValue(date, selectedValue, mode)

    if (value === undefined) {
      setUncontrolledValue(nextValue)
    }

    onValueChange?.(nextValue)
  }

  return (
    <div className={clsx(s.root, className)} {...rest}>
      <label className={s.label}>{resolvedLabel}</label>
      <button
        className={clsx(s.input, errorMessage && s.inputError)}
        disabled={disabled}
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span>{displayValue}</span>
        <CalendarIcon className={s.inputIcon} />
      </button>

      {errorMessage && <span className={s.errorMessage}>{errorMessage}</span>}

      {isOpen && (
        <div className={s.popup}>
          <div className={s.header}>
            <span className={s.monthTitle}>{formatMonthTitle(visibleMonth)}</span>
            <div className={s.navigation}>
              <button
                aria-label="Previous month"
                className={s.navigationButton}
                type="button"
                onClick={handlePreviousMonth}
              >
                <ChevronLeftIcon />
              </button>
              <button
                aria-label="Next month"
                className={s.navigationButton}
                type="button"
                onClick={handleNextMonth}
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className={s.weekDays}>
            {weekDays.map((weekDay) => (
              <span className={s.weekDay} key={weekDay}>
                {weekDay}
              </span>
            ))}
          </div>

          <div className={s.calendarGrid}>
            {calendarDays.map((calendarDay) => {
              const rangeState = getRangeState(calendarDay.date, selectedValue, mode)
              const isSelected = isSelectedDay(calendarDay.date, selectedValue, mode)

              return (
                <button
                  className={clsx(
                    s.dayCell,
                    rangeState === 'start' && s.rangeStart,
                    rangeState === 'middle' && s.rangeMiddle,
                    rangeState === 'end' && s.rangeEnd,
                    isSelected && s.selectedDay,
                  )}
                  key={calendarDay.date.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(calendarDay.date)}
                >
                  <span
                    className={clsx(
                      s.day,
                      calendarDay.isWeekend && s.weekend,
                      !calendarDay.isCurrentMonth && s.otherMonth,
                      calendarDay.isToday && s.today,
                    )}
                  >
                    {calendarDay.dayOfMonth}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const getCalendarDays = (monthDate: Date): CalendarDay[] => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const mondayBasedWeekDay = (firstDayOfMonth.getDay() + 6) % 7
  const startDate = new Date(year, month, 1 - mondayBasedWeekDay)

  return Array.from({ length: 42 }, (_, dayIndex) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + dayIndex)

    return {
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, new Date()),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    }
  })
}

const getMonthDate = (value: Date | DateRangeValue | null): Date => {
  if (!value) {
    return new Date(defaultSingleDate.getFullYear(), defaultSingleDate.getMonth(), 1)
  }

  const date = value instanceof Date ? value : (value.to ?? value.from ?? defaultSingleDate)

  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const getDisplayValue = (value: Date | DateRangeValue | null, mode: DatePickerMode): string => {
  if (!value) {
    return ''
  }

  if (mode === 'single') {
    return value instanceof Date ? formatDate(value) : ''
  }

  if (value instanceof Date) {
    return formatDate(value)
  }

  const from = value.from ? formatDate(value.from) : ''
  const to = value.to ? formatDate(value.to) : ''

  return [from, to].filter(Boolean).join(' - ')
}

const getRangeState = (
  date: Date,
  value: Date | DateRangeValue | null,
  mode: DatePickerMode,
): 'start' | 'middle' | 'end' | null => {
  if (!value || mode !== 'range' || value instanceof Date || !value.from || !value.to) {
    return null
  }

  if (isSameDay(date, value.from)) {
    return 'start'
  }

  if (isSameDay(date, value.to)) {
    return 'end'
  }

  return date > value.from && date < value.to ? 'middle' : null
}

const isSelectedDay = (
  date: Date,
  value: Date | DateRangeValue | null,
  mode: DatePickerMode,
): boolean => {
  if (!value) {
    return false
  }

  if (mode === 'single') {
    return value instanceof Date && isSameDay(date, value)
  }

  if (value instanceof Date) {
    return isSameDay(date, value)
  }

  return Boolean(
    (value.from && isSameDay(date, value.from)) || (value.to && isSameDay(date, value.to)),
  )
}

const getNextValue = (
  date: Date,
  value: Date | DateRangeValue | null,
  mode: DatePickerMode,
): Date | DateRangeValue => {
  if (mode === 'single') {
    return date
  }

  if (!value || value instanceof Date || !value.from || value.to) {
    return { from: date, to: null }
  }

  if (date < value.from) {
    return { from: date, to: value.from }
  }

  return { from: value.from, to: date }
}

const addMonths = (date: Date, months: number): Date => {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

const formatMonthTitle = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

const isSameDay = (leftDate: Date, rightDate: Date): boolean => {
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  )
}
