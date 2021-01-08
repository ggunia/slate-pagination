import shortid from 'shortid'
import { Transforms } from 'slate'

import rowMeasurer from './rowMeasurer'
import removeLastLine from './removeLastLine'
import setSelection from './setSelection'

const defaultParagraph = text => ({
  type: 'paragraph',
  id: shortid.generate(),
  children: [{ text }],
})

const breakComponent = ({ info, config, dimensions }) => {
  const { editor, node, path } = info

  const nextNode = editor
    .children[path[0] + 1]
    .children[0]

  if (!nextNode || nextNode.type !== 'component') {
    Transforms.insertNodes(
      editor,
      { type: 'component', id: shortid.generate(), children: [defaultParagraph('')] },
      { at: [path[0] + 1, 0] }
    )
  }

  let contentBefore = editor
    .children[path[0]]
    .children
    .slice(0, path[1])
    .reduce((acc, curr) => acc + rowMeasurer({ node: curr, config, dimensions }), 0)
  let breakIndex = 0
  const { children: [{ text }] } = node.children[node.children.length - 1]

  for (let i = 0; i < text.length; i += 5) {
    const newText = text.slice(0, i + 5)
    const componentHeight = rowMeasurer({
      node: {
        ...node,
        children: node
          .children
          .map((curr, index, arr) => index === arr.length - 1
            ? defaultParagraph(newText)
            : curr)
      },
      config,
      dimensions,
    })

    if (contentBefore + componentHeight > dimensions.pageHeight) {
      breakIndex = Math.max(0, i - 5)
      break
    }
  }

  if (breakIndex === 0) {
    Transforms.liftNodes(editor, { at: [...path, node.children.length - 1] })

    const moveNodeFromIndex = node.children.length === 1
      ? path[1]
      : path[1] + 1

    Transforms.moveNodes(editor, {
      at: [path[0], moveNodeFromIndex],
      to: [path[0] + 1, 0, 0]
    })
    removeLastLine({ editor })
    return
  }

  Transforms.insertText(
    editor,
    text.slice(0, breakIndex),
    { at: [...path, node.children.length - 1] }
  )

  Transforms.insertNodes(
    editor,
    defaultParagraph(text.slice(breakIndex)),
    { at: [path[0] + 1, 0, 0] }
  )
  removeLastLine({ editor })
  setSelection({
    editor,
    page: path[0] + 1,
    componentRow: 0,
    row: 0,
    offset: 0
  })

  return
}

export default breakComponent
