'use client'

import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { DatePicker } from '@/shared/ui/date-picker'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { TextArea } from '@/shared/ui/text-area/TextArea'

import type { EditProfileFormProps, EditProfileFormValues } from '../model/types'
import styles from './edit-profile-form.module.css'

export function EditProfileForm({
  cityOptionsByCountryValue,
  countryOptions,
  initialValues,
  onSubmitAction,
}: EditProfileFormProps) {
  const { t } = useI18n()
  const formId = useId()
  const requiredFieldMessage = t.profile.edit.requiredField
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting, isValid },
  } = useForm<EditProfileFormValues>({
    defaultValues: initialValues,
    mode: 'onChange',
  })

  const onSubmit = async (values: EditProfileFormValues): Promise<void> => {
    setSubmitError(null)

    try {
      const savedValues = await onSubmitAction(values)
      reset(savedValues)
    } catch {
      setSubmitError(t.profile.edit.saveFailed)
    }
  }

  return (
    <section aria-labelledby="edit-profile-title" className={styles.root}>
      <nav aria-label={t.profile.edit.generalInformation} className={styles.tabs}>
        <span className={styles.tabActive}>{t.profile.edit.generalInformation}</span>
        <span className={styles.tab}>{t.profile.edit.devices}</span>
        <span className={styles.tab}>{t.profile.edit.accountManagement}</span>
        <span className={styles.tab}>{t.profile.edit.myPayments}</span>
      </nav>

      <form className={styles.form} id={formId} noValidate onSubmit={handleSubmit(onSubmit)}>
        <h1 className={styles.visuallyHidden} id="edit-profile-title">
          {t.profile.edit.generalInformation}
        </h1>

        <Controller
          control={control}
          name="username"
          rules={{ required: requiredFieldMessage }}
          render={({ field, fieldState }) => (
            <div className={styles.textField}>
              <Input
                {...field}
                autoComplete="username"
                error={fieldState.error?.message}
                label={t.profile.edit.username}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="firstName"
          rules={{ required: requiredFieldMessage }}
          render={({ field, fieldState }) => (
            <div className={styles.textField}>
              <Input
                {...field}
                autoComplete="given-name"
                error={fieldState.error?.message}
                label={t.profile.edit.firstName}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="lastName"
          rules={{ required: requiredFieldMessage }}
          render={({ field, fieldState }) => (
            <div className={styles.textField}>
              <Input
                {...field}
                autoComplete="family-name"
                error={fieldState.error?.message}
                label={t.profile.edit.lastName}
              />
            </div>
          )}
        />

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <DatePicker
              className={styles.dateOfBirthField}
              label={t.profile.edit.dateOfBirth}
              onValueChange={(value) => {
                if (value instanceof Date) {
                  field.onChange(value)
                }
              }}
              value={field.value}
            />
          )}
        />

        <div className={styles.locationFields}>
          <Controller
            control={control}
            name="country"
            render={({ field, fieldState }) => (
              <Select
                errorMessage={fieldState.error?.message}
                label={t.profile.edit.selectYourCountry}
                onValueChange={field.onChange}
                options={countryOptions}
                placeholder={t.profile.edit.country}
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <Select
                disabled={!initialValues.country}
                errorMessage={fieldState.error?.message}
                label={t.profile.edit.selectYourCity}
                onValueChange={field.onChange}
                options={cityOptionsByCountryValue[initialValues.country] ?? []}
                placeholder={t.profile.edit.city}
                value={field.value}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="aboutMe"
          render={({ field, fieldState }) => (
            <TextArea
              {...field}
              className={styles.aboutMeField}
              error={fieldState.error?.message}
              label={t.profile.edit.aboutMe}
              rows={4}
            />
          )}
        />

        {submitError ? <p role="alert">{submitError}</p> : null}
      </form>

      <div className={styles.actions}>
        <Button
          disabled={!isDirty || !isValid}
          form={formId}
          loading={isSubmitting}
          loadingText={t.profile.edit.saving}
          type="submit"
        >
          {t.profile.edit.saveChanges}
        </Button>
      </div>
    </section>
  )
}
