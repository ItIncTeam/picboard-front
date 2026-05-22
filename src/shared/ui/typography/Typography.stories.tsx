import { Meta } from '@storybook/nextjs-vite'
import { Typography } from '@/shared/ui'

const meta = {
  title: 'Shared/Typography',
  component: Typography.H1,
  tags: ['autodocs'],
} satisfies Meta<typeof Typography.H1>

export default meta

export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Typography.Large>Large</Typography.Large>

      <Typography.H1>Heading 1</Typography.H1>
      <Typography.H2>Heading 2</Typography.H2>
      <Typography.H3>Heading 3</Typography.H3>

      <Typography.RegularText16>Regular Text 16</Typography.RegularText16>

      <Typography.BoldText16>Bold Text 16</Typography.BoldText16>

      <Typography.RegularText14>Regular Text 14</Typography.RegularText14>

      <Typography.MediumText14>Medium Text 14</Typography.MediumText14>

      <Typography.BoldText14>Bold Text 14</Typography.BoldText14>

      <Typography.SmallText>Small Text</Typography.SmallText>

      <Typography.SemiBoldSmallText>Semi Bold Small Text</Typography.SemiBoldSmallText>

      <Typography.RegularLink href="#">Regular Link</Typography.RegularLink>

      <Typography.SmallLink href="#">Small Link</Typography.SmallLink>
    </div>
  ),
}

export const CustomComponent = {
  render: () => (
    <Typography.H1 component="a" href="#">
      H1 as link
    </Typography.H1>
  ),
}

export const Margins = {
  render: () => (
    <Typography.H1 ml={10} mt={20}>
      Heading with margins
    </Typography.H1>
  ),
}

export const Colors = {
  render: () => <Typography.H2 color="var(--color-primary)">Colored text</Typography.H2>,
}
