import traverse from '@babel/traverse'
import { parse as babelParser } from '@babel/parser'
import { compile, parse } from '@vue/compiler-dom/index'


export function buildFileMap (fileMap, context) {
  const reg = new RegExp(/\.js$|\.ts$|\.vue/)
  Object.keys(fileMap).forEach((id) => {

    if (!fileMap[id] || !reg.test(id)) return true

    const el = context.getModuleInfo(id)

    const isVue = id.endsWith('.vue')

    try {
      const unusedImporter = isVue
        ? findUnusedImportsInVue(el.originalCode)
        : findUnusedImports(el.originalCode)

      if (unusedImporter.size)
        fileMap[el.id].add(
          `${Array.from(unusedImporter).join(' , ')} was imported/declared , but never use.`,
        )
    } catch (err) {
      fileMap[el.id].add(`编译出错 message：${err.message}`)
    }

    if (!isVue) {
      el.ast.body.forEach((m) => {
        if (!m.included && !m.type.includes('Import')) {
          let content = `${m.context.code.substring(m.start, m.end)}`
          if (
            !content.includes('/* @__PURE__ */') &&
            !new RegExp(/.*export.*from.*/).test(content)
          )
            fileMap[el.id].add(content)
        }
      })
    }
  })
}

function findUnusedImports(originalCode, templateVars = new Set()) {
  let unusedVars = new Set()

  const astree = babelParser(originalCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  traverse(astree, {
    Program: function (path) {
      const binding = path.scope.getAllBindings()
      for (let key in binding) {
        if (!binding[key].referenced && !templateVars.has(key)) unusedVars.add(key)
      }
    },
  })

  return unusedVars
}

function findUnusedImportsInVue(originalCode) {
  const ast = parse(originalCode)

  const script = ast.children.find(
    (v) =>
      v.tag === 'script' && !v.props.some((p) => p.src) && v.children.length,
  )

  if (!script) return new Set()

  const templateVars = findTemplateVars(
    ast.children.find((v) => v.tag === 'template'),
  )

  if (script.props.some((v) => v.name === 'setup')) {
    return findUnusedImports(script.children[0].content, templateVars)
  } else {
    return findUnusedVarsInVue(script.children[0].content, templateVars)
  }
}

function findTemplateVars(node) {
  const usedVars = new Set()

  const r = compile(node)

  r.ast.components.forEach((c) => {
    let tagName = c.replace(/-(\w)/g, upper)
    usedVars.add(tagName)
    usedVars.add(tagName.replace(tagName[0], tagName[0].toUpperCase()))
  })

  const astree = babelParser(`(function(){${r.code}})`)

  traverse(astree, {
    Identifier: function (path) {
      if (
        path.key !== 'property' &&
        path.listKey !== 'property' &&
        node.loc.source.includes(path?.node?.name)
      ) {
        usedVars.add(path?.node?.name || '')
      }
    },
  })

  return usedVars
}

function upper(all, letter) {
  return letter.toUpperCase()
}

function findUnusedVarsInVue(originalCode, templateVars = new Set()) {
  let unusedVars = new Set()

  const astree = babelParser(originalCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  const vueKeyWords = new Set([
    'props',
    'data',
    'setup',
    'watch',
    'computed',
    'methods',
    'inject',
  ])
  const vueVars = new Set()

  traverse(astree, {
    Program: function (path) {
      const binding = path.scope.getAllBindings()
      for (let key in binding) {
        if (!binding[key].referenced && !templateVars.has(key))
          unusedVars.add(key)
      }
    },
    ObjectExpression: function (path) {
      if (path?.parent?.type === 'ExportDefaultDeclaration') {
        path.node.properties.forEach((n) => {
          if (vueKeyWords.has(n?.key?.name)) {
            if (n.type === 'ObjectProperty') {
              if (n.value.type === 'ArrayExpression') {
                n.value.elements.forEach(
                  (p) =>
                    !templateVars.has(p?.value || '') &&
                    vueVars.add(p?.value || ''),
                )
              } else if (n.value.type === 'ObjectExpression') {
                n.value.properties.forEach((p) => {
                  if (p.type === 'SpreadElement') {
                    if (
                      p?.argument?.callee?.name?.includes('map') &&
                      p?.argument?.arguments?.length
                    ) {
                      const t =
                        p.argument.arguments[p.argument.arguments.length - 1]
                      if (t.type === 'ArrayExpression') {
                        t.elements.forEach(
                          (v) =>
                            !templateVars.has(v?.value || '') &&
                            vueVars.add(v?.value || ''),
                        )
                      } else if (t.type === 'ObjectExpression') {
                        t.properties.forEach(
                          (v) =>
                            !templateVars.has(v?.key?.name || '') &&
                            vueVars.add(v?.key?.name || ''),
                        )
                      }
                    }
                  } else {
                    !templateVars.has(p?.key?.name || '') &&
                      vueVars.add(p?.key?.name || '')
                  }
                })
              } else if (n.value.type === 'FunctionExpression') {
                n.value.body.body.forEach((b) => {
                  if (b.type === 'ReturnStatement')
                    b.argument.properties.forEach(
                      (p) =>
                        !templateVars.has(p?.key?.name) &&
                        vueVars.add(p?.key?.name || ''),
                    )
                })
              }
            } else if (n.type === 'ObjectMethod') {
              n.body.body.forEach((b) => {
                if (b.type === 'ReturnStatement')
                  b.argument.properties.forEach(
                    (p) =>
                      !templateVars.has(p?.key?.name) &&
                      vueVars.add(p?.key?.name || ''),
                  )
              })
            }
          }
        })
      }
    },
  })

  traverse(astree, {
    MemberExpression: function (path) {
      if (
        vueVars.has(path?.node?.property?.name) &&
        path?.node?.object?.type === 'ThisExpression'
      )
        vueVars.delete(path?.node?.property?.name)
    },
  })

  vueVars.forEach((v) => v.trim() && unusedVars.add(v))

  return unusedVars
}