import traverse from '@babel/traverse'
import { parse as babelParser } from '@babel/parser'
import { compile, parse } from '@vue/compiler-dom/index'


export function buildFileMap (fileMap, context) {
  const reg = new RegExp(/\.js$|\.ts$|\.vue/)
  Object.keys(fileMap).forEach((id) => {

    if (!fileMap[id] || !reg.test(id)) return true

    const el = context.getModuleInfo(id).originModule

    const isVue = id.endsWith('.vue')

    try {
      const unusedCodeMap = isVue
        ? findUnusedCodeInVue(el.originalCode)
        : findUnusedCode(el.originalCode)

        for (let key in unusedCodeMap) {
          fileMap[el.id].add(unusedCodeMap[key])
        }
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

function findUnusedCode(originalCode, templateVars = new Set()) {
  const unusedVars = {};

  const astree = babelParser(originalCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  traverse(astree, {
    Program: function (path) {
      const binding = path.scope.getAllBindings()
      for (let key in binding) {
        if (!binding[key].referenced && !templateVars.has(key)) unusedVars[key] = `${binding[key].kind} - ${originalCode.substring(binding[key].identifier.start, binding[key].identifier.end)}`;
      }
    },
  })

  return unusedVars
}

function findUnusedCodeInVue(originalCode) {
  const ast = parse(originalCode)

  const script = ast.children.find(
    (v) =>
      v.tag === 'script' && !v.props.some((p) => p.src) && v.children.length,
  )

  if (!script) return {}

  const templateVars = findTemplateVars(
    ast.children.find((v) => v.tag === 'template'),
  )

  if (script.props.some((v) => v.name === 'setup')) {
    return findUnusedCode(script.children[0].content, templateVars)
  } else {
    return findUnusedCodeInVueObject(script.children[0].content, templateVars)
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
    ObjectProperty: function(path) {
      if (path.node?.key?.name === 'callback' || path.node?.key?.name === 'callbackName') {
        if (path.node?.value?.value) usedVars.add(path.node?.value?.value)
      }
    }
  })

  return usedVars
}

function upper(all, letter) {
  return letter.toUpperCase()
}

function findUnusedCodeInVueObject(originalCode, templateVars = new Set()) {
  const unusedVars = {};

  const astree = babelParser(originalCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  const vueKeyWords = new Set([
    'props',
    'data',
    'setup',
    'computed',
    'methods',
    'inject',
  ])
  const vueVars = {};

  const addValue = (key, node, val, parent) => {
		if (!templateVars.has(val))	vueVars[val] = `${key} - ${originalCode.substring(parent?.start || node.start, parent?.end || node.end)}`
	}

  traverse(astree, {
    Program: function (path) {
      const binding = path.scope.getAllBindings()
      for (let key in binding) {
        if (!binding[key].referenced && !templateVars.has(key)) unusedVars[key] = `${binding[key].kind} - ${originalCode.substring(binding[key].identifier.start, binding[key].identifier.end)}`;
      }
    },
    ObjectExpression: function (path) {
      if (path?.parent?.type === 'ExportDefaultDeclaration') {
        path.node.properties.forEach((n) => {
          if (vueKeyWords.has(n?.key?.name)) {
            if (n.type === 'ObjectProperty') {
              if (n.value.type === 'ArrayExpression') {
                n.value.elements.forEach(
                  (p) => addValue(n?.key?.name, p, p.value)
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
                          (v) => addValue(p?.argument?.callee?.name, v, v.value)
                        )
                      } else if (t.type === 'ObjectExpression') {
                        t.properties.forEach(
                          (v) => addValue(p?.argument?.callee?.name, v.key, v?.key?.name, v)
                        )
                      }
                    }
                  } else if (p.key.type === 'StringLiteral') {
										addValue(n?.key?.name, p.key, p?.key?.value, p)
                  } else {
										addValue(n?.key?.name, p.key, p?.key?.name, p)
									}
                })
              } else if (n.value.type === 'FunctionExpression') {
                n.value.body.body.forEach((b) => {
                  if (b.type === 'ReturnStatement')
                    b.argument.properties.forEach(
                      (p) => addValue(n?.key?.name, p.key, p?.key?.name, p)
                    )
                })
              }
            } else if (n.type === 'ObjectMethod') {
              n.body.body.forEach((b) => {
                if (b.type === 'ReturnStatement')
                  b.argument.properties.forEach(
										(p) => addValue(n?.key?.name, p.key, p?.key?.name, p)
                  )
              })
            }
          }
        })
      }
    },
  })

  traverse(astree, {
		VariableDeclarator: function (path) {
			if (path?.node?.init?.type === 'ThisExpression') {
				const name = path.node.id.name
				path.scope.traverse(path.scope.block, {
					MemberExpression: function (blockPath) {
						if (
							vueVars[blockPath?.node?.property?.name] &&
							blockPath?.node?.object?.name === name
						)
							delete vueVars[blockPath?.node?.property?.name];
					}
				})
			}
		},
		AssignmentExpression: function (path) {
			if (path?.node?.right?.type === 'ThisExpression') {
				const name = path.node.left.name
				path.scope.traverse(path.scope.block, {
					MemberExpression: function (blockPath) {
						if (
							vueVars[blockPath?.node?.property?.name] &&
							blockPath?.node?.object?.name === name
						)
							delete vueVars[blockPath?.node?.property?.name];
					}
				})
			}
		},
    MemberExpression: function (path) {
      if (
        vueVars[path?.node?.property?.name] &&
        path?.node?.object?.type === 'ThisExpression'
      )
        delete vueVars[path?.node?.property?.name];
    },
    ObjectProperty: function(path) {
      if (path?.parentPath?.parent?.type === 'ExportDefaultDeclaration' && path.node?.key?.name === 'watch') {
        path.node.value.properties.forEach(v => {
          if (vueVars[v?.key?.name]) delete vueVars[v?.key?.name];
					if (vueVars[v?.key?.value]) delete vueVars[v?.key?.value];
        })
      } else if (path.node?.key?.name === 'callback' || path.node?.key?.name === 'callbackName') {
				if (vueVars[path.node?.value?.value]) delete vueVars[path.node?.value?.value]
      }
    }
  })

  return {
		...unusedVars,
		...vueVars
	}
}