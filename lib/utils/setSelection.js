import { Transforms } from 'slate'

const setSelection = ({ editor, page, row, componentRow, offset }) => {
  const path = componentRow
    ? [page, row, componentRow]
    : [page, row]

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
