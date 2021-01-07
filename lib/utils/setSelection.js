import { Transforms } from 'slate'

const setSelection = ({ editor, page, row, componentRow, offset }) => {
  const path = componentRow !== undefined
    ? [page, row, componentRow, 0]
    : [page, row, 0]

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
