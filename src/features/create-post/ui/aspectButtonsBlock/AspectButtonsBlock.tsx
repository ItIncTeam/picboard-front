import styles from './aspect-button-block.module.css'
import {
  AspectRatio16_9,
  AspectRatio1_1,
  AspectRatio4_5,
  AspectRatioOrigin,
  Close,
  ShowSwiper,
} from '@/shared/assets'
import type { AspectRatio } from '@/features/create-post'

type Props = {
  onSelectRatio: (ratio: AspectRatio) => void
  selectedRatio: AspectRatio
}

export const AspectButtonsBlock = ({ onSelectRatio, selectedRatio }: Props) => {
  return (
    <div className={styles.aspectButtonBlock}>
      <button
        type="button"
        onClick={() => onSelectRatio('original')}
        data-active={selectedRatio === 'original'}
      >
        <span>Оригинал</span>
        <AspectRatioOrigin width="18px" height="18px" />
      </button>
      <button
        type="button"
        onClick={() => onSelectRatio('1:1')}
        data-active={selectedRatio === '1:1'}
      >
        <span>1:1</span>
        <AspectRatio1_1 width="18px" height="18px" />
      </button>
      <button
        type="button"
        onClick={() => onSelectRatio('4:5')}
        data-active={selectedRatio === '4:5'}
      >
        <span>4:5</span>
        <AspectRatio4_5 width="18px" height="26px" />
      </button>
      <button
        type="button"
        onClick={() => onSelectRatio('16:9')}
        data-active={selectedRatio === '16:9'}
      >
        <span>16:9</span>
        <AspectRatio16_9 width="26px" height="20px" />
      </button>
    </div>
  )
}
