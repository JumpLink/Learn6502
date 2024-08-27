import './global.d.ts'
import '@girs/gjs/dom'
import '@girs/gjs'
import GLib from '@girs/glib-2.0'
import system from 'system'

import { Application } from './application.ts'

const loop = GLib.MainLoop.new(null, false)

export async function main(argv: string[]) {
  const application = new Application()
  const exitCode = await application.runAsync(argv)
  loop.quit()
  return exitCode
}

try {
  const exitCode = await main(
    [imports.system.programInvocationName].concat(ARGV),
  )
  log('exitCode: ' + exitCode)
  system.exit(exitCode)
} catch (error) {
  console.error('An error occurred:', error)
  system.exit(1)
} finally {
  // Stelle sicher, dass die Hauptschleife beendet wird, falls sie noch läuft
  if (loop.is_running()) {
    loop.quit()
  }
}