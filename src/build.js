

export function buildFileMap (fileMap, fileObj) {
  Object.keys(fileObj).forEach((id) => {
    const importMaps = fileObj[id].importMaps
    for (const key in importMaps) {
      if (typeof importMaps[key] === 'string') {
        fileObj[key]?.exportNames.clear()
      } else {
        importMaps[key].forEach(v => {
          fileObj[key]?.exportNames.delete(v.importName)
        })
      }
    }
  })


  Object.keys(fileObj).forEach((id) => {
    for (let key in fileObj[id].unusedCodeMap) {
      if (!fileMap[id][fileObj[id].unusedCodeMap[key].type]) fileMap[id][fileObj[id].unusedCodeMap[key].type] = []
      fileMap[id][fileObj[id].unusedCodeMap[key].type].push(fileObj[id].unusedCodeMap[key].text)
    }

    if (fileObj[id].exportNames.size) {
      fileMap[id].uselessExportNames = Array.from(fileObj[id].exportNames)
    }

    if (fileObj[id].errMessage) fileMap[id].errMessage = fileObj[id].errMessage
  })
}
