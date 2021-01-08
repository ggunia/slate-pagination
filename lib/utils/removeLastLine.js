import { Transforms } from 'slate'

const removeLastLine = ({ editor }) => {
  const pageLength = editor
    .children
    .length
  const linesLength = editor
    .children[pageLength - 1]
    .children
    .length

  const lastPage = editor.children[pageLength - 1]
  const lastLine = lastPage.children[linesLength - 1]

  if (!lastLine) return
  if (!lastLine.text !== undefined) return

  Transforms.removeNodes(editor, { at: [pageLength - 1, linesLength - 1] })
}

export default removeLastLine
