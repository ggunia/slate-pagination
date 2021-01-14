import React, { useCallback } from 'react'
import { Path, Text, Range } from 'slate'

const useCursors = ({ userId = 'fuck you' }) => {
  const [selections, setSelections] = React.useState([])

  const decorate = useCallback(([node, path]) => {
    const ranges = []

    if (Text.isText(node) && selections.length) {
      selections
        .filter(({ selection }) => Boolean(selection))
        .filter(({ id }) => id !== userId)
        .forEach(({ selection, color, name }) => {
          if (Range.includes(selection, path)) {
            const { focus, anchor, isForward } = selection

            const isFocusNode = Path.equals(focus.path, path)
            const isAnchorNode = Path.equals(anchor.path, path)

            ranges.push({
              ...selection,
              name,
              color,
              alphaColor: '#fff',
              isCaret: isFocusNode,
              anchor: {
                path,
                offset: isAnchorNode
                  ? anchor.offset
                  : isForward
                    ? 0
                    : node.text.length
              },
              focus: {
                path,
                offset: isFocusNode
                  ? focus.offset
                  : isForward
                    ? node.text.length
                    : 0
              }
            })
          }
        })
    }

    return ranges
  },
    [selections]
  )

  return {
    decorate,
    selections,
    setSelections
  }
}

export default useCursors
