

export function buildFileMap (fileMap, fileObj) {
  Object.keys(fileObj).forEach((id) => {
    const importMaps = fileObj[id].importMaps
    for (const key in importMaps) {
      importMaps[key].forEach(v => {
        fileObj[key].exportNames.delete(v.importName)
      })
    }
  })


  Object.keys(fileObj).forEach((id) => {
    for (let key in fileObj[id].unusedCodeMap) {
      fileMap[id].add(fileObj[id].unusedCodeMap[key])
    }

    fileObj[id].exportNames.forEach(v => fileMap[id].add(`export - ${v}\n`))

    if (fileObj[id].errMessage) fileMap[id].add(fileObj[id].errMessage)
  })
}