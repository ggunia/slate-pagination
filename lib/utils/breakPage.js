import shortid from 'shortid'
import { Transforms } from 'slate'

import removeLastLine from './removeLastLine'
import setSelection from './setSelection'
import rowMeasurer from './rowMeasurer'
import getNodeText from './getNodeText'

const defaultParagraph = text => ({
  type: 'paragraph',
  id: shortid.generate(),
  children: [{ text }],
})

const breakPage = ({ info, config, dimensions }) => {
  const { editor, node, path } = info
  const nodeText = getNodeText({ node })

  if (node.type === 'component') {
    Transforms.liftNodes(editor, { at: [...path, node.children.length - 1] })
    console.log(editor.children)
    const moveNodeFromIndex = node.children.length === 1
      ? path[1]
      : path[1] + 1

    const nextNode = editor
      .children[path[0] + 1]
      .children[0]

    if (!nextNode || nextNode.type !== 'component') {
      Transforms.insertNodes(
        editor,
        { type: 'component', id: shortid.generate(), children: [] },
        { at: [path[0] + 1, 0] }
      )
    }

    Transforms.moveNodes(editor, {
      at: [path[0], moveNodeFromIndex],
      to: [path[0] + 1, 0, 0]
    })
    return
  }

  let contentBeforeHeight = editor
    .children[path[0]]
    .children
    .slice(0, path[1])
    .reduce((acc, curr) => acc + rowMeasurer({ node: curr, config, dimensions }), 0)
  let breakIndex = 0

  for (let i = 0; i < nodeText.length; i += 5) {
    const text = nodeText.slice(0, i + 5)
    const height = rowMeasurer({ node: defaultParagraph(text), config, dimensions })

    if (contentBeforeHeight + height > dimensions.pageHeight) {
      breakIndex = Math.max(0, i - 5)
      break
    }
  }

  if (breakIndex === 0) {
    Transforms.removeNodes(editor, { at: [path[0], path[1]] })
  } else {
    Transforms.insertText(editor, nodeText.slice(0, breakIndex), { at: path })
  }

  Transforms.insertNodes(editor, defaultParagraph(nodeText.slice(breakIndex)), { at: [path[0] + 1, 0] })
  removeLastLine({ editor })

  setSelection({ editor, page: path[0] + 1, row: 0, offset: nodeText.length - breakIndex })
}

export default breakPage
