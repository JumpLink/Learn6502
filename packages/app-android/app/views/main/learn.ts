import { EventData } from '@nativescript/core'

import { Page } from '@nativescript/core'

class LearnController {
  private page: Page | null = null

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page
    this.page = page

    console.log('learn: onNavigatingTo', this.page)
  }
}

const learnController = new LearnController()

export const onNavigatingTo =
  learnController.onNavigatingTo.bind(learnController)
