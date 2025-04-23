import './types/global.d.ts'
import '@girs/gjs/dom'
import '@girs/gjs'
import { loop } from './bootstrap.ts'
import { programInvocationName, exit} from 'system'
import { Application } from './application.ts'

async function main(argv: string[]) {
  const application = new Application()
  const exitCode = await application.runAsync(argv)
  loop.quit()
  return exitCode
}

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
