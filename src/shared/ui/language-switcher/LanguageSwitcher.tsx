'use client'

import { EnFlagImage, RuFlagImage } from '@/shared/assets'
import { Select, type SelectOption } from '@/shared/ui/select'
import { isLanguage, languages, useI18n } from '@/shared/lib/i18n'
import styles from './language-switcher.module.css'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  const options: SelectOption[] = [
    {
      value: languages.en,
      label: t.languageSwitcher.english,
      image: EnFlagImage.src,
    },
    {
      value: languages.ru,
      label: t.languageSwitcher.russian,
      image: RuFlagImage.src,
    },
  ]

  const handleValueChange = (value: string): void => {
    if (isLanguage(value)) {
      setLanguage(value)
    }
  }

  return (
    <div className={styles.root}>
      <Select
        contentClassName={styles.content}
        iconClassName={styles.icon}
        options={options}
        triggerAriaLabel={t.languageSwitcher.selectLanguage}
        triggerClassName={styles.trigger}
        value={language}
        valueLabelClassName={styles.valueLabel}
        onValueChange={handleValueChange}
      />
    </div>
  )
}
