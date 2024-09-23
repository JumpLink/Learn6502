pkgdatadir = get_option('datadir') / meson.project_name()

yarn_args = ['--cwd', meson.project_source_root()]

sources = [
  'main.ts',
]

yarn_install = run_target('yarn-install',
  command: [yarn, yarn_args, 'install'],
)

yarn_build = custom_target('yarn-build',
  output: ['eu.jumplink.Easy6502'],
  command: [yarn, yarn_args, 'build'],
  build_by_default: true
)
