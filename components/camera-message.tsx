'use client'

import { useAtom, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cameraMessageAtom, hideCameraMessageAtom } from '@/atoms/camera'

export function CameraMessage() {
  const [messageState] = useAtom(cameraMessageAtom)
  const hideMessage = useSetAtom(hideCameraMessageAtom)

  return (
    <Dialog open={messageState.visible} onOpenChange={(open) => !open && hideMessage()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Camera Access</DialogTitle>
          <DialogDescription>
            {messageState.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={hideMessage} variant="default" className="w-full">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 