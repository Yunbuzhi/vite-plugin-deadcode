import { env, exit } from 'node:process'
import { createFileMap } from './create'
import { generateFileObj, flushFileQueue } from './generate'
import { buildFileMap } from './build'
import { writeFileMap } from './write'

function deadcodePlugins(customOptions = {}) {

  if (env.DEAD_CODE !== 'true') return {}

  const options = {
    inputDir: 'src',
    outDir: 'dist',
    breakBuild: true,
    ...customOptions
  }

  const fileMap = {}
  const fileObj = {}

  return {
    name: 'vite-deadcode-plugin',
    async buildStart() {
      await createFileMap(fileMap, options.inputDir)
    },
    async moduleParsed(module) {
      if (fileMap.hasOwnProperty(module.id)) fileMap[module.id] = new Set() 
    },
    async buildEnd() {
      let temp = null
      for (const key in fileMap) {
        if (fileMap[key]) {
          temp = await generateFileObj(key, this, fileMap)
          if (temp) fileObj[key] = temp
        }
      }

      await flushFileQueue(this, fileObj, fileMap)

      buildFileMap(fileMap, fileObj)
      writeFileMap(fileMap, options.outDir)
      if (options.breakBuild) exit(0)
    }
  }
}

export default deadcodePlugins
