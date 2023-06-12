

export function buildFileMap (fileMap, fileObj) {
  Object.keys(fileObj).forEach((id) => {
    const importMaps = fileObj[id].importMaps
    for (const key in importMaps) {
      if (typeof importMaps[key] === 'string') {
        fileObj[key].exportNames.clear()
      } else {
        importMaps[key].forEach(v => {
          fileObj[key].exportNames.delete(v.importName)
        })
      }
    }
  })


  Object.keys(fileObj).forEach((id) => {
    for (let key in fileObj[id].unusedCodeMap) {
      fileMap[id].add(fileObj[id].unusedCodeMap[key])
    }

    if (fileObj[id].exportNames.size) fileMap[id].add(`Useless to export ${Array.from(fileObj[id].exportNames).join('、')}.`)

    if (fileObj[id].errMessage) fileMap[id].add(fileObj[id].errMessage)
  })
}