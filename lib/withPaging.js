import { Transforms, Element, Node } from 'slate'

import createNewPage from './utils/createNewPage'
import breakPage from './utils/breakPage'
import rowMeasurer from './utils/rowMeasurer'
import getPageDimensions from './utils/getPageDimensions'
import breakComponent from './utils/breakComponent'

const withPaging = config => (editor) => {
  const { normalizeNode, apply } = editor

  editor.normalizeNode = (entry) => {
    const [node, path] = entry
    const dimensions = getPageDimensions(node.id)

    if (Element.isElement(node) && node.type === 'page') {
      for (const [child, childPath] of Node.children(editor, path)) {
        const height = node
          .children
          .slice(0, childPath[1] + 1)
          .reduce((acc, curr) => acc + rowMeasurer({ node: curr, config, dimensions }), 0)
        const currPage = childPath[0]

        if (height > dimensions.pageHeight) {
          const nextPage = editor.children[currPage + 1]

          if (!nextPage) {
            createNewPage({ editor, node, currPageIndex: currPage })
          }

          const info = { editor, node: child, path: childPath }

          if (child.type === 'component') {
            breakComponent({ info, config, dimensions })
          } else {
            breakPage({ info, config, dimensions })
          }
        }
      }

      const nextPage = editor.children[path[0] + 1]

      // delete backwards functionality
      if (nextPage) {
        const content = nextPage.children
        const totalHeight = node
          .children
          .reduce((acc, curr) => acc + rowMeasurer({ node: curr, config, dimensions }), 0)

        if (totalHeight < dimensions.pageHeight && Boolean(content.length)) {
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

  editor.apply = (operation) => {
    if (operation.type === 'split_node' && operation.properties.type) {
      // Do something here
    }

    apply(operation)
  }

  return editor
}

export default withPaging
