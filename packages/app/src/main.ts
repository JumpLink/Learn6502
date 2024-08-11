import './global.d.ts'
import '@girs/gjs/dom'
import '@girs/gjs'
import GLib from '@girs/glib-2.0'
import system from 'system'

import { Application } from './application.ts'

const loop = GLib.MainLoop.new(null, false)

export function main(argv: string[]) {
  const application = new Application()
  return application.runAsync(argv)
}

const exit_code = await main(
  [imports.system.programInvocationName].concat(ARGV),
)
log('exit_code: ' + exit_code)
system.exit(exit_code)

await loop.runAsync()
