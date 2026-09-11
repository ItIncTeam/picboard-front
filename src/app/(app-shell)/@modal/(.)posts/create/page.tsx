import { ProtectedRouteBoundary } from '@/features/auth/session-management'
import { CreatePostModal } from '@/widgets/create-post-modal'

export default function Page() {
  return (
    <ProtectedRouteBoundary>
      <CreatePostModal />
    </ProtectedRouteBoundary>
  )
}
