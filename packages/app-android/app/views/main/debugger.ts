import { EventData } from '@nativescript/core'

import { Page } from '@nativescript/core'

class DebuggerController {
  private page: Page | null = null

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page
    this.page = page

    console.log('debugger: onNavigatingTo', this.page)
  }
}

const debuggerController = new DebuggerController()

export const onNavigatingTo =
  debuggerController.onNavigatingTo.bind(debuggerController)
