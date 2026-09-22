'use client'

import { useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { useI18n } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/button'
import { DatePicker } from '@/shared/ui/date-picker'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { TextArea } from '@/shared/ui/text-area/TextArea'
import { DocModal } from '@/widgets/doc-modal'

import { createEditProfileValidationRules } from '../model/editProfileValidation'
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
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const validationRules = createEditProfileValidationRules(t.profile.edit)
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty, isSubmitting, isValid },
  } = useForm<EditProfileFormValues>({
    defaultValues: initialValues,
    mode: 'onChange',
  })
  const selectedCountry = useWatch({ control, name: 'country' })
  const cityOptions = cityOptionsByCountryValue[selectedCountry] ?? []

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
      <form className={styles.form} id={formId} noValidate onSubmit={handleSubmit(onSubmit)}>
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
                className={styles.dateOfBirthField}
                errorMessage={fieldState.error?.message}
                label={t.profile.edit.dateOfBirth}
                onBlur={field.onBlur}
                onValueChange={(value) => {
                  if (value instanceof Date) {
                    field.onChange(value)
                  }
                }}
                value={field.value}
              />
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
                disabled={!selectedCountry || cityOptions.length === 0}
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
      {isPrivacyPolicyOpen ? (
        <DocModal kind="privacy" onCloseAction={() => setIsPrivacyPolicyOpen(false)} />
      ) : null}
    </section>
  )
}
