import shortid from 'shortid'
import { Transforms } from 'slate'

import rowMeasurer from './rowMeasurer'

const defaultParagraph = text => ({
  type: 'paragraph',
  id: shortid.generate(),
  children: [{ text }],
})

const breakPage = ({ editor, path, nodeText }, config) => {
  let contentBeforeHeight = editor
    .children[path[0]]
    .children
    .slice(0, path[1])
    .reduce((acc, curr) => acc + rowMeasurer(curr, config), 0)
  let breakIndex = 0

  for (let i = 0; i < nodeText.length; i += 5) {
    const height = rowMeasurer(defaultParagraph(nodeText.slice(0, i + 5)), config)

    if (contentBeforeHeight + height > config.pageHeight) {
      breakIndex = Math.max(0, i - 5)
      break
    }
  }

  Transforms.insertText(
    editor,
    nodeText.slice(0, breakIndex),
    { at: path }
  )
  Transforms.insertNodes(
    editor,
    defaultParagraph(nodeText.slice(breakIndex)),
    { at: [path[0] + 1, 0] }
  )
  Transforms.removeNodes(
    editor,
    {
      at: [
        editor.children.length - 1,
        editor.children[editor.children.length - 1].children.length - 1
      ]
    }
  )

  Transforms.setSelection(editor, {
    anchor: {
      path: [path[0] + 1, 0, 0],
      offset: nodeText.length - breakIndex,
    },
    focus: {
      path: [path[0] + 1, 0, 0],
      offset: nodeText.length - breakIndex,
    },
  })
}

export default breakPage
