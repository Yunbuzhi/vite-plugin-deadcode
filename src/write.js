import { cwd } from 'node:process'
import {
  existsSync,
  mkdirSync,
  writeFileSync
} from 'node:fs'

const createHtmlTemplate = (content1, content2, content3) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>deadcode</title>
</head>
<body>
  <div>
    <h2>DeadFiles</h2>
    <div style="height: 37.5vh;overflow: auto">
      ${content1}
    </div>
  </div>
  <div>
    <h2>DeadCode</h2>
    <div class="div-flex">
      <div style="width: 50vw; height: 37.5vh; overflow: auto;">
        ${content2}
      </div>
      <div style="width: 50vw; height:37.5vh; overflow: auto;">
        ${content3}
      </div>
    </div>
  </div>
  <style>
    .div-flex {
      display: flex;
    }
    #activeTab {
      color: skyblue;
    }
    .content2 {
      word-break: break-all;
    }
    .content2:hover {
      cursor: pointer;
    }
    .content3 {
      display: none;
    }
    #activeDom {
      display: block;
    }
  </style>
  <script>
    let activeDom = document.getElementById('activeDom')
    let activeTab = document.getElementById('activeTab')

    document.addEventListener('click', (event) => {
      if (event.target.className.includes('content2')) {
        activeDom.removeAttribute('id')
        activeDom = document.querySelectorAll('.content3')[event.target.dataset.index]
        activeDom.setAttribute('id', 'activeDom')


        activeTab.removeAttribute('id')
        event.target.setAttribute('id', 'activeTab')
        activeTab = event.target
      }
    })

  </script>
</body>
</html>`

export function writeFileMap(fileMap, outDir) {
  let content1 = '',
    content2 = '',
    content3 = '',
    count = 0;

  for (const key in fileMap) {
    if (!fileMap[key]) {
      content1 += `
      <p>${key}</p>`
    } else if (Object.keys(fileMap[key]).length) {
      content2 += `
      <p class="content2" ${!count? 'id="activeTab"' : ''} data-index="${count}">
        ${key}
      </p>`

      let temp = ''

      for(const k in fileMap[key]) {
        let t1 = ''
        if (typeof fileMap[key][k] === 'string') {
          t1 = fileMap[key][k]
        } else {
          for (let i in fileMap[key][k]) {
            t1 += `<p>${fileMap[key][k][i]}</p>
            `
          }
        }
        temp += `
        <div class="div-flex" style="align-items: center; margin-bottom: 20px">
          <p style="margin: 0 20px">${k}</p>
          <div>${t1}</div>
        </div>`
      }

      content3 += `
      <div class="content3" ${!count? 'id="activeDom"' : ''}>
        ${temp}
      </div>`

      count++
    }
  }

  writeContent('deadcode.html', createHtmlTemplate(content1, content2, content3), outDir)
}

export function writeContent(fileName, content, outDir) {
  const base = cwd()
  const path = `/${outDir}/`
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