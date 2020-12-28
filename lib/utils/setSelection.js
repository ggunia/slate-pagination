import { Transforms } from 'slate'

const setSelection = ({ editor, page, row, offset }) => {
  Transforms.setSelection(editor, {
    anchor: {
      path: [page, row, 0],
      offset,
    },
    focus: {
      path: [page, row, 0],
      offset,
    },
  })
}

export default setSelection
