import shortid from 'shortid'
import { Transforms } from 'slate'

import removeLastLine from './removeLastLine'
// import setSelection from './setSelection'
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

  const nextNode = editor
    .children[path[0] + 1]
    .children[0]

  if (!nextNode || nextNode.type !== 'component') {
    Transforms.insertNodes(
      editor,
      defaultParagraph(nodeText.slice(breakIndex)),
      { at: [path[0] + 1, 0] }
    )
  } else {
    const finalPath = []

    editor
      .children
      .slice(path[0])
      .forEach((page, pageIndex) => {
        const indexOfNonComponent = page
          .children
          .findIndex(block => block.type !== 'component')

        if (finalPath.length === 2) return

        if (indexOfNonComponent !== -1) {
          finalPath.push(pageIndex)
          finalPath.push(indexOfNonComponent)
        }
      })

    if (finalPath.length !== 2) {
      const lastPageIndex = editor.children.length - 1
      const lastLineIndex = editor
        .children[lastPageIndex]
        .children
        .length

      finalPath.push(lastPageIndex)
      finalPath.push(lastLineIndex)
    }

    Transforms.insertNodes(
      editor,
      defaultParagraph(nodeText.slice(breakIndex)),
      { at: finalPath }
    )
  }

  removeLastLine({ editor })
}

export default breakPage
