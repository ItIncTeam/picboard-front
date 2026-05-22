'use client'

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import clsx from 'clsx'
import { ComponentPropsWithoutRef, useMemo, useState } from 'react'

import s from './date-picker.module.css'

type DatePickerMode = 'single' | 'range'
type DatePickerState = 'default' | 'hover' | 'focus' | 'error' | 'disabled'
type DatePickerDayState = 'default' | 'selected' | 'hover' | 'active' | 'focus'
type DatePickerRangeState = 'none' | 'start' | 'middle' | 'end'

type DateRangeValue = {
  from: Date | null
  to: Date | null
}

type DatePickerDayOverride = {
  date: Date
  state?: DatePickerDayState
  range?: DatePickerRangeState
}

type Props = {
  label?: string
  mode?: DatePickerMode
  state?: DatePickerState
  value?: Date | DateRangeValue | null
  defaultValue?: Date | DateRangeValue | null
  defaultOpen?: boolean
  disabled?: boolean
  errorMessage?: string
  today?: Date
  dayOverrides?: DatePickerDayOverride[]
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

/**
 * Используй как контролируемое поле формы с `value` и `onValueChange`.
 *
 * В одиночном режиме возвращает `Date`. В режиме диапазона возвращает
 * `{ from: Date | null; to: Date | null }`.
 * Преобразуй выбранные даты в ISO-строки перед отправкой на API.
 *
 * `state`, `today` и `dayOverrides` используются в основном для визуальных
 * состояний, Storybook и дизайн-ревью.
 */

export const DatePicker = ({
  label,
  mode = 'single',
  state = 'default',
  value,
  defaultValue,
  defaultOpen = false,
  disabled = false,
  errorMessage,
  today = new Date(),
  dayOverrides = [],
  onValueChange,
  className,
  ...rest
}: Props) => {
  const isDisabled = disabled || state === 'disabled'
  const isError = Boolean(errorMessage) || state === 'error'
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const fallbackValue = mode === 'range' ? defaultRangeValue : defaultSingleDate
  const [uncontrolledValue, setUncontrolledValue] = useState<Date | DateRangeValue | null>(
    defaultValue ?? fallbackValue,
  )
  const selectedValue = value === undefined ? uncontrolledValue : value
  const monthDate = getMonthDate(selectedValue)
  const [visibleMonth, setVisibleMonth] = useState(monthDate)

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth, today), [today, visibleMonth])
  const displayValue = getDisplayValue(selectedValue, mode)
  const resolvedLabel = label ?? (mode === 'range' ? 'Date range' : 'Date')
  const resolvedErrorMessage =
    errorMessage ?? (state === 'error' ? getDefaultErrorMessage(mode) : '')

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
    <div className={clsx(s.datePicker, className)} {...rest}>
      <label className={clsx(s.datePicker__label, isDisabled && s.datePicker__label_disabled)}>
        {resolvedLabel}
      </label>
      <button
        className={clsx(
          s.datePicker__input,
          state === 'hover' && s.datePicker__input_hover,
          state === 'focus' && s.datePicker__input_focus,
          isError && s.datePicker__input_error,
          isDisabled && s.datePicker__input_disabled,
        )}
        disabled={isDisabled}
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span>{displayValue}</span>
        <CalendarIcon className={s.datePicker__inputIcon} />
      </button>

      {resolvedErrorMessage && (
        <span className={s.datePicker__errorMessage}>{resolvedErrorMessage}</span>
      )}

      {isOpen && (
        <div className={s.datePicker__popup}>
          <div className={s.datePicker__header}>
            <span className={s.datePicker__monthTitle}>{formatMonthTitle(visibleMonth)}</span>
            <div className={s.datePicker__navigation}>
              <button
                aria-label="Previous month"
                className={s.datePicker__navigationButton}
                type="button"
                onClick={handlePreviousMonth}
              >
                <ChevronLeftIcon />
              </button>
              <button
                aria-label="Next month"
                className={s.datePicker__navigationButton}
                type="button"
                onClick={handleNextMonth}
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className={s.datePicker__weekDays}>
            {weekDays.map((weekDay) => (
              <span className={s.datePicker__weekDay} key={weekDay}>
                {weekDay}
              </span>
            ))}
          </div>

          <div className={s.datePicker__calendarGrid}>
            {calendarDays.map((calendarDay) => {
              const dayOverride = getDayOverride(calendarDay.date, dayOverrides)
              const rangeState =
                dayOverride?.range ?? getRangeState(calendarDay.date, selectedValue, mode)
              const dayState =
                dayOverride?.state ??
                (isSelectedDay(calendarDay.date, selectedValue, mode) ? 'selected' : 'default')

              return (
                <button
                  className={clsx(
                    s.datePicker__dayCell,
                    rangeState === 'start' && s.datePicker__dayCell_rangeStart,
                    rangeState === 'middle' && s.datePicker__dayCell_rangeMiddle,
                    rangeState === 'end' && s.datePicker__dayCell_rangeEnd,
                    dayState === 'selected' && s.datePicker__dayCell_selected,
                    dayState === 'hover' && s.datePicker__dayCell_hover,
                    dayState === 'active' && s.datePicker__dayCell_active,
                    dayState === 'focus' && s.datePicker__dayCell_focus,
                  )}
                  key={calendarDay.date.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(calendarDay.date)}
                >
                  <span
                    className={clsx(
                      s.datePicker__day,
                      calendarDay.isWeekend && s.datePicker__day_weekend,
                      !calendarDay.isCurrentMonth && s.datePicker__day_otherMonth,
                      calendarDay.isToday && s.datePicker__day_today,
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

const getCalendarDays = (monthDate: Date, today: Date): CalendarDay[] => {
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
      isToday: isSameDay(date, today),
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
): DatePickerRangeState => {
  if (!value || mode !== 'range' || value instanceof Date || !value.from || !value.to) {
    return 'none'
  }

  if (isSameDay(date, value.from)) {
    return 'start'
  }

  if (isSameDay(date, value.to)) {
    return 'end'
  }

  return date > value.from && date < value.to ? 'middle' : 'none'
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

const getDayOverride = (
  date: Date,
  dayOverrides: DatePickerDayOverride[],
): DatePickerDayOverride | undefined => {
  return dayOverrides.find((dayOverride) => isSameDay(dayOverride.date, date))
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

const getDefaultErrorMessage = (mode: DatePickerMode): string => {
  return mode === 'range' ? 'Error, select current month or last month' : 'Error!'
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
