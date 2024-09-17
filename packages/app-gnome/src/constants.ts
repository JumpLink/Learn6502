export const APPLICATION_ID = __APPLICATION_ID__ || 'eu.jumplink.Easy6502'
export const RESOURCES_PATH = '/' + APPLICATION_ID.replaceAll('.', '/')
export const VERSION = __VERSION__ || '0.0.0'
export const PREFIX = __PREFIX__ || '/usr'
export const LIBDIR = __LIBDIR__ || `${PREFIX}/lib`
export const DATADIR = __DATADIR__ || `${PREFIX}/data`
export const BINDIR = __BINDIR__ || `${PREFIX}/bin`
