import shortid from 'shortid'
import { Transforms } from 'slate'

import rowMeasurer from './rowMeasurer'
import getNodeText from './getNodeText'
import setSelection from './setSelection'

const norm = editor => editor
  .children
  .map(curr => curr.children.map(curr => curr.children[0].text))

const defaultParagraph = text => ({
  type: 'paragraph',
  id: shortid.generate(),
  children: [{ text }],
})

const breakPage = ({ info, config, dimensions }) => {
  const { editor, node, page, path } = info

  console.log('starting with -> ', norm(editor), node)

  const nodeText = getNodeText({ node })

  let contentBeforeHeight = editor
    .children[path[0]]
    .children
    .slice(0, path[1])
    .reduce((acc, curr) => acc + rowMeasurer({ node: curr, config, dimensions }), 0)

  let breakIndex = 0

  if (path[1] < page.children.length - 1) {
    editor
      .children[path[0]]
      .children
      .slice(path[1] + 1)
      .forEach(() => {
        const at = [path[0], path[1] + 1]
        const to = [path[0] + 1, 0]

        Transforms.moveNodes(editor, { at, to })
      })
    console.log('after moving nodes', norm(editor))
  }

  for (let i = 0; i < nodeText.length; i += 5) {
    const text = nodeText.slice(0, i + 5)
    const height = rowMeasurer({ node: defaultParagraph(text), config, dimensions })

    if (contentBeforeHeight + height > dimensions.pageHeight) {
      breakIndex = i
      break
    }
  }

  if (breakIndex === 0) {
    Transforms.moveNodes(editor, { at: path, to: [path[0] + 1, 0] })
    console.log('after breakIndex = 0', norm(editor))
    return
  } else {
    Transforms.insertText(editor, nodeText.slice(0, breakIndex), { at: path })
    setSelection({ editor, page: path[0], row: path[1] })
    console.log('after inserting text', norm(editor))
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
    console.log('after inserting node', norm(editor))
  } else {
    console.log('INSIDE ELSE !!')
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

  setSelection({ editor, page: path[0] + 1, row: 0 })
  console.log('-------------------------------------------------------')
}

export default breakPage
