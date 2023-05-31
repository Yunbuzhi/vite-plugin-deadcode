import { env } from 'node:process'
import { createFileMap } from './create'
import { buildFileMap } from './build'
import { writeRollupSourceCode, writeFileMap } from './write'

const DEADCODE = env.DEAD_CODE === 'true'

if (DEADCODE) writeRollupSourceCode()

function deadcodePlugins(customOptions = {}) {

  if (!DEADCODE) return {}

  const options = {
    inputDir: 'src',
    outDir: 'dist',
    breakBuild: true,
    ...customOptions
  }

  const fileMap = {}

  return {
    name: 'vite-deadcode-plugin',
    async buildStart() {
      await createFileMap(fileMap, options.inputDir)
    },
    async moduleParsed(module) {
      if (fileMap.hasOwnProperty(module.id)) fileMap[module.id] = new Set()
    },
    async buildEnd() {
      buildFileMap(fileMap, this)
      writeFileMap(fileMap, options.outDir)
      if (options.breakBuild) {
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        console.log('deadcode write complete!')
        this.error('deadcode write complete!')
      }
    }
  }
}

export default deadcodePlugins
