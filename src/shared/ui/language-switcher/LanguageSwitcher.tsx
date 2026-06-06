'use client'

import { useState } from 'react'

import { EnFlagImage, RuFlagImage } from '@/shared/assets'
import { Select, type SelectOption } from '@/shared/ui/select'

import styles from './language-switcher.module.css'

type LanguageSwitcherProps = {
  defaultValue?: string
  options?: SelectOption[]
}

const defaultLanguageOptions: SelectOption[] = [
  {
    value: 'en',
    label: 'English',
    image: EnFlagImage.src,
  },
  {
    value: 'ru',
    label: 'Russian',
    image: RuFlagImage.src,
  },
]

export function LanguageSwitcher({
  defaultValue = 'en',
  options = defaultLanguageOptions,
}: LanguageSwitcherProps) {
  const [language, setLanguage] = useState(defaultValue)

  return (
    <div className={styles.root}>
      <Select options={options} value={language} onValueChange={setLanguage} />
    </div>
  )
}
