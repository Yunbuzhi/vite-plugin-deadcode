import { cwd } from 'node:process'
import {
  existsSync,
  mkdirSync,
  writeFileSync
} from 'node:fs'

export function writeFileMap(fileMap, outDir) {
  let uselessFileContent = '',
    uselessCodeContent = ''

  for (const key in fileMap) {
    if (!fileMap[key]) {
      uselessFileContent += `${key}\n`
    } else if (fileMap[key].size) {
      uselessCodeContent += `${key}\n`

      fileMap[key].forEach((str) => uselessCodeContent += `${str}\n`)

      uselessCodeContent += '\n\n'
    }
  }

  writeContent('file.txt', uselessFileContent, outDir)
  writeContent('code.txt', uselessCodeContent, outDir)
}

export function writeContent(fileName, content, outDir) {
  const base = cwd()
  const path = `/${outDir}/deadcode/`
  if (!existsSync(base + path)) autoMkdir(base, path)

  writeFileSync(base + path + fileName, content)
  console.log(`${base + path + fileName} write complete!`)
}

export function autoMkdir(base, path) {
  const arr = path.split('/').filter((s) => s)
  let baseUrl = base
  for (let i = 0; i < arr.length; i++) {
    baseUrl += '/' + arr[i]
    if (!existsSync(baseUrl)) mkdirSync(baseUrl)
  }
}