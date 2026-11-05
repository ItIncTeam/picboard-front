'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { DatePicker } from '@/shared/ui/date-picker'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { TextArea } from '@/shared/ui/text-area/TextArea'
import { DocModal } from '@/widgets/doc-modal'

import { getEditProfileErrors } from '../model/editProfileErrors'
import { createEditProfileValidationRules } from '../model/editProfileValidation'
import type { EditProfileFormProps, EditProfileFormValues } from '../model/types'
import styles from './edit-profile-form.module.css'

export function EditProfileForm({
  cityOptionsByCountryValue,
  countryOptions,
  initialValues,
  locationDisabled = false,
  onSubmitAction,
}: EditProfileFormProps) {
  const { t } = useI18n()
  const formId = useId()
  const submitInFlightRef = useRef(false)
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const validationRules = createEditProfileValidationRules(t.profile.edit)
  const {
    clearErrors,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { dirtyFields, isDirty, isSubmitting, isValid },
  } = useForm<EditProfileFormValues>({
    defaultValues: initialValues,
    mode: 'onChange',
  })
  const selectedCountry = useWatch({ control, name: 'country' })
  const cityOptions = cityOptionsByCountryValue[selectedCountry] ?? []

  const onSubmit = async (values: EditProfileFormValues): Promise<void> => {
    clearErrors()
    setSubmitError(null)

    try {
      const savedValues = await onSubmitAction(values, dirtyFields)
      reset(savedValues)
    } catch (error) {
      const fieldErrors = getEditProfileErrors(error, t.profile.edit)
      if (fieldErrors.length === 0) setSubmitError(t.profile.edit.saveFailed)
      for (const { field, message, type } of fieldErrors) setError(field, { message, type })
    }
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (submitInFlightRef.current) return
    submitInFlightRef.current = true
    try {
      await handleSubmit(onSubmit)(event)
    } finally {
      submitInFlightRef.current = false
    }
  }

  return (
    <section aria-labelledby="edit-profile-title" className={styles.root}>
      <form className={styles.form} id={formId} noValidate onSubmit={submitForm}>
        <h1 className={styles.visuallyHidden} id="edit-profile-title">
          {t.profile.edit.generalInformation}
        </h1>

        <Controller
          control={control}
          name="username"
          rules={validationRules.username}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              disabled={isSubmitting}
              autoComplete="username"
              error={fieldState.error?.message}
              label={t.profile.edit.username}
            />
          )}
        />

        <Controller
          control={control}
          name="firstName"
          rules={validationRules.firstName}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              disabled={isSubmitting}
              autoComplete="given-name"
              error={fieldState.error?.message}
              label={t.profile.edit.firstName}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          rules={validationRules.lastName}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              disabled={isSubmitting}
              autoComplete="family-name"
              error={fieldState.error?.message}
              label={t.profile.edit.lastName}
            />
          )}
        />

        <Controller
          control={control}
          name="dateOfBirth"
          rules={validationRules.dateOfBirth}
          render={({ field, fieldState }) => (
            <div>
              <DatePicker
                disabled={isSubmitting}
                className={styles.dateOfBirthField}
                errorMessage={fieldState.error?.message}
                label={t.profile.edit.dateOfBirth}
                onBlur={field.onBlur}
                onValueChange={(value) => {
                  if (!isSubmitting && value instanceof Date) {
                    field.onChange(value)
                  }
                }}
                value={field.value}
              />
              {field.value ? (
                <Button
                  disabled={isSubmitting}
                  type="button"
                  variant="textButton"
                  onClick={() => field.onChange(null)}
                >
                  {t.profile.edit.clearDateOfBirth}
                </Button>
              ) : null}
              {fieldState.error?.type === 'minimumAge' ? (
                <p className={styles.privacyPolicyHint}>
                  {t.profile.edit.privacyPolicyHint}{' '}
                  <button
                    className={styles.privacyPolicyLink}
                    onClick={() => setIsPrivacyPolicyOpen(true)}
                    type="button"
                  >
                    {t.profile.edit.privacyPolicy}
                  </button>
                </p>
              ) : null}
            </div>
          )}
        />

        <div className={styles.locationFields}>
          <Controller
            control={control}
            name="country"
            render={({ field, fieldState }) => (
              <Select
                disabled={locationDisabled || isSubmitting}
                errorMessage={fieldState.error?.message}
                label={t.profile.edit.selectYourCountry}
                onBlur={field.onBlur}
                onValueChange={(country) => {
                  if (country !== field.value) {
                    setValue('city', '', { shouldDirty: true, shouldValidate: true })
                  }

                  field.onChange(country)
                }}
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
                disabled={
                  isSubmitting || locationDisabled || !selectedCountry || cityOptions.length === 0
                }
                errorMessage={fieldState.error?.message}
                label={t.profile.edit.selectYourCity}
                onBlur={field.onBlur}
                onValueChange={field.onChange}
                options={cityOptions}
                placeholder={t.profile.edit.city}
                value={field.value}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="aboutMe"
          rules={validationRules.aboutMe}
          render={({ field, fieldState }) => (
            <TextArea
              {...field}
              disabled={isSubmitting}
              className={styles.aboutMeField}
              error={fieldState.error?.message}
              label={t.profile.edit.aboutMe}
              rows={4}
            />
          )}
        />

        {locationDisabled ? <p>{t.profile.edit.locationUnavailable}</p> : null}
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
      {isPrivacyPolicyOpen ? (
        <DocModal kind="privacy" onCloseAction={() => setIsPrivacyPolicyOpen(false)} />
      ) : null}
    </section>
  )
}
