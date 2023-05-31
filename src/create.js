import { cwd } from 'node:process'
import {
  lstatSync,
  readdirSync,
} from 'node:fs'

async function readPath(fileMap, folderPath) {
  if (folderPath) {
    readdirSync(folderPath).forEach(async (name) => {
      const path = folderPath + '/' + name
      if (isFile(path)) {
        fileMap[path] = false
      } else {
        await readPath(fileMap, path)
      }
    })
  }
}

export async function createFileMap(fileMap, inputDir) {

  await readPath(fileMap, `${cwd()}/${inputDir}`)

  return fileMap
}

export const isFile = (fileName) => lstatSync(fileName).isFile()