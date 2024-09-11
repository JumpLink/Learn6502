project('app-gnome', 'c')

yarn = find_program('yarn', required: true)

build_target = custom_target('build',
  output: 'yarn-build-stamp',
  command: [
    'sh', '-c',
    'echo "Running yarn install and build..." && ' +
    yarn.path() + ' install && ' +
    yarn.path() + ' run build && ' +
    'touch @OUTPUT@'
  ],
  build_by_default: true,
  build_always_stale: false
)

alias_target('build-yarn', build_target)
