import shortid from 'shortid'
import { Transforms } from 'slate'
import removeLastLine from './removeLastLine'

const initialPage = () => ({
  type: 'page',
  id: shortid.generate(),
  children: [
    {
      type: 'paragraph',
      id: shortid.generate(),
      children: [{ text: '' }]
    }
  ]
})

const createNewPage = ({ editor, currPageIndex }) => {
  const lastIndex = editor
    .children[currPageIndex]
    .children
    .length

  Transforms.insertNodes(
    editor,
    initialPage(),
    { at: [currPageIndex, lastIndex] }
  )

  Transforms.liftNodes(editor, { at: [currPageIndex, lastIndex] })

  const lastPageIndex = editor.children.length - 1
  const lastNodeIndex = editor
    .children[lastPageIndex]
    .children
    .length - 1

  removeLastLine({ editor })
  // Transforms.removeNodes(editor, { at: [lastPageIndex, lastNodeIndex] })
}

export default createNewPage
