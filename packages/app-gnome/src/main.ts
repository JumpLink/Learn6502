import './global.d.ts'
import '@girs/gjs/dom'
import '@girs/gjs'
import GLib from '@girs/glib-2.0'
import { programInvocationName, exit} from 'system'
import { APPLICATION_ID, VERSION, PREFIX, LIBDIR, DATADIR } from './constants.ts'

import { Application } from './application.ts'

imports.package.init({
  name: APPLICATION_ID,
  version: VERSION,
  prefix: PREFIX,
  libdir: LIBDIR,
  datadir: DATADIR,
});

pkg.initGettext();

const loop = GLib.MainLoop.new(null, false)

async function main(argv: string[]) {
  const application = new Application()
  const exitCode = await application.runAsync(argv)
  loop.quit()
  return exitCode
}

// TODO: Use `imports.package.run` instead of `await main(argv)`?
try {
  const exitCode = await main(
    [programInvocationName].concat(ARGV),
  )
  log('exitCode: ' + exitCode)
  exit(exitCode)
} catch (error) {
  console.error('An error occurred:', error)
  exit(1)
} finally {
  if (loop.is_running()) {
    loop.quit()
  }
}
