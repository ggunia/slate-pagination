import { Transforms, Element, Node } from 'slate'

import createNewPage from './utils/createNewPage'
import breakPage from './utils/breakPage'
import rowMeasurer from './utils/rowMeasurer'
import getNodeText from './utils/getNodeText'

const withPaging = config => (editor) => {
  const { normalizeNode } = editor

  editor.normalizeNode = (entry) => {
    const [node, path] = entry

    if (Element.isElement(node) && node.type === 'page') {
      for (const [child, childPath] of Node.children(editor, path)) {
        // get child node height to check if it needs to be normalized
        const height = node
          .children
          .slice(0, childPath[1] + 1)
          .reduce((acc, curr) => acc + rowMeasurer(curr, config), 0)
        const currPage = childPath[0]

        if (height > config.pageHeight) {
          const nextPage = editor.children[currPage + 1]

          if (!nextPage) {
            createNewPage({ editor, node, currPageIndex: currPage })
            return
          }

          const nodeText = getNodeText({ node: child })

          if (nodeText && height > config.pageHeight) {
            breakPage({ editor, path: childPath, nodeText }, config)
            return
          }

          Transforms.moveNodes(editor, {
            at: childPath,
            to: [childPath[0] + 1, 0]
          })
          return
        }
      }

      const nextPage = editor.children[path[0] + 1]

      // delete backwards functionality
      if (nextPage) {
        const content = nextPage.children
        const totalHeight = node
          .children
          .reduce((acc, curr) => acc + rowMeasurer(curr, config), 0)

        if (totalHeight < config.pageHeight && Boolean(content.length)) {
          Transforms.moveNodes(editor, {
            at: [path[0] + 1, 0],
            to: [path[0], node.children.length]
          })

          if (content.length === 1) {
            Transforms.removeNodes(editor, { at: [path[0] + 1] })
          }
        }
      }
    }

    normalizeNode(entry)
  }

  return editor
}

export default withPaging
