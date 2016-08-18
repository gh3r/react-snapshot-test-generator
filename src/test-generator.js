#!/usr/bin/env node

import yargs from 'yargs'
import fs from 'fs'
import transformDefinitions, { jestReactMocks, jsxProps } from './functions'
import { componentImport, testDescription } from './templates'

const argv = yargs.usage('Usage: $0 [options]')
                  .example('$0', 'Generates tests with default options')
                  .alias('d', 'output-directory')
                  .nargs('d', 1)
                  .describe('d', 'Output directory')
                  .default('d', '__tests__')
                  .alias('o', 'output')
                  .nargs('o', 1)
                  .default('o', 'snapshotTests')
                  .describe('o', 'Name of the output module')
                  .alias('c', 'config')
                  .nargs('c', 1)
                  .describe('c', 'Name of the config module')
                  .default('c', 'snapshotTestConfig')
                  .help('help')
                  .alias('h', 'help')
                  .alias('n', 'native')
                  .describe('n', 'Use React Native')
                  .default('n', false)
                  .alias('nm', 'native-module')
                  .describe('nm', 'Name of React Native module')
.nargs('nm', 1)
                  .default('nm', 'react-native')
                  .argv

const workingDirectory = process.cwd()
const configFilename = argv.config
const configFilepath = `${workingDirectory}/${configFilename}`

let configuration
try {
  configuration = require(configFilepath)
} catch (error) {
  console.error(error)
  yargs.showHelp()
  process.exit(1)
}

const { autoMocks, componentDefinitions } = configuration

const describedComponents = transformDefinitions(componentDefinitions,
  ({components}) => components.map(comp =>
    comp.props.map(props => testDescription(comp.name, jsxProps(props)))
        .join("\n")))

const componentImports = transformDefinitions(componentDefinitions,
  ({path, components}) => components.map(comp => componentImport(path, comp.name)))

const comment = `/* Component tests generated by react-snapshot-test-generator on ${new Date().toISOString()} */`

const reactNativeImport = argv.n ? `import '${argv.nm}'` : ""
const generatedMocks = autoMocks ? jestReactMocks(autoMocks) : ""

const template = `${comment}
${reactNativeImport}
import React from 'React'
import renderer from 'react-test-renderer'

function snapshotTest(element) {
  const tree = renderer.create(element).toJSON()
  expect(tree).toMatchSnapshot()
}

${generatedMocks}

${componentImports}

${describedComponents}
`

const outputFile = argv.output
const outputDir = argv['output-directory']

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)
fs.writeFile(`${workingDirectory}/${outputDir}/${outputFile}.js`, template)