import shortid from 'shortid'
import { Transforms } from 'slate'

const initialPage = () => ({
  type: 'page',
  id: shortid.generate(),
  children: []
})

const createNewPage = ({ editor, currPageIndex }) => {
  const lastIndex = editor
    .children[currPageIndex]
    .children
    .length

  Transforms.insertNodes(editor, initialPage(), { at: [currPageIndex, lastIndex] })
  Transforms.liftNodes(editor, { at: [currPageIndex, lastIndex] })
}

export default createNewPage
