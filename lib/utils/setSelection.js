import { Transforms } from 'slate'

const setSelection = ({ editor, page, row, componentRow }) => {
  const path = componentRow !== undefined
    ? [page, row, componentRow, 0]
    : [page, row, 0]

  const offset = editor
    .children[page]
    .children[row]
    .children
    .reduce((acc, curr) => acc + curr.text.length, 0)

  Transforms.setSelection(editor, {
    anchor: {
      path,
      offset,
    },
    focus: {
      path,
      offset,
    },
  })
}

export default setSelection
