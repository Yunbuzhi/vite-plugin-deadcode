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
    ...customOptions
  }

  const fileMap = {}
  const fileObj = {}

  return {
    name: 'vite-deadcode-plugin',
    options() {
      return {
        treeshake: false,
        watch: false
      }
    },
    async buildStart() {
      try {
        await createFileMap(fileMap, options.inputDir)
      } catch(err) {
        console.log(`err: createFileMap error \n ${err}`)
      }
    },
    async moduleParsed(module) {
      if (fileMap.hasOwnProperty(module.id)) fileMap[module.id] = new Set() 
    },
    async buildEnd() {
      try {
        let temp = null
        for (const key in fileMap) {
          if (fileMap[key]) {
            temp = await generateFileObj(key, this, fileMap)
            if (temp) fileObj[key] = temp
          }
        }
      } catch(err) {
        console.log(`err: generateFileObj error \n ${err}`)
      }

      try {
        await flushFileQueue(this, fileObj, fileMap)
      } catch(err) {
        console.log(`err: flushFileQueue error \n ${err}`)
      }


      try {
        buildFileMap(fileMap, fileObj)
      } catch(err) {
        console.log(`err: buildFileMap error \n ${err}`)
      }

      try {
        writeFileMap(fileMap, options.outDir)
      } catch(err) {
        console.log(`err: writeFileMap error \n ${err}`)
      }

      exit(0)
    }
  }
}

export default deadcodePlugins
