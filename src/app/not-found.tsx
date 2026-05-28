import { Input } from '@/shared/ui/input/Input'
import Logo from '@/shared/assets/icon/search.svg'

export default function NotFound() {
  return (
    <div style={{ backgroundColor: 'black' }}>
      <Input
        variant="defaultIcon"
        placeholder="Not Found"
        label="Not Found"
        Icon={Logo}
        disabled={true}
      />
      <h1>App Not Found</h1>
    </div>
  )
}
