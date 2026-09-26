import type { AspectRatio, CreatePostStep, ImageFilter } from '@/features/create-post'

export const CREATE_POST_STEPS: CreatePostStep[] = ['upload', 'crop', 'filters', 'publication']

export const CREATE_POST_ASPECT_RATIOS: AspectRatio[] = ['original', '1:1', '4:5', '16:9']

export const CREATE_POST_FILTERS: ImageFilter[] = ['normal', 'clarendon', 'lark', 'gingham', 'moon']

export const CREATE_POST_INITIAL_STEP: CreatePostStep = 'upload'

export const CREATE_POST_CAPTION_MAX_LENGTH = 500
