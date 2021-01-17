import React from 'react'
import { Slate, withReact, Editable } from 'slate-react'
import { createEditor, Transforms } from 'slate'
import { createGlobalStyle } from 'styled-components'
import shortid from 'shortid'

import withPagination from '../../lib/withPaging'
import { getSelectedRange, selectRange } from './editorUtils'
import withRectangleSelect from './withRectangleSelect'
import withNodeId from './withNodeId'
import Page from './Page'
import Component from './Component'

const GlobalStyles = createGlobalStyle`
  .selection-area {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .selected {
    background: rgba(211,218,225,0.5);
    padding: 0 5px;
    border-left: 2px solid black;
  }

  .component p {
    background-color: black !important;
    color: white;
  }
`

const initialState = [
  {
    type: 'page',
    id: shortid.generate(),
    children: [
      {
        type: 'paragraph',
        id: shortid.generate(),
        children: [{ text: 'paragraph 1' }],
      },
      {
        type: 'paragraph',
        id: shortid.generate(),
        children: [{ text: 'paragraph 2' }],
      },
      {
        type: 'paragraph',
        id: shortid.generate(),
        children: [{ text: 'paragraph 3' }],
      },
    ]
  },
  {
    type: 'page',
    id: shortid.generate(),
    children: [
      {
        type: 'paragraph',
        id: shortid.generate(),
        children: [{ text: 'paragraph 4' }],
      },
      {
        type: 'paragraph',
        id: shortid.generate(),
        children: [{ text: 'paragraph 5' }],
      },
      {
        type: 'paragraph',
        id: shortid.generate(),
        children: [{ text: 'paragraph 6' }],
      },
    ]
  },
]

export default function App() {
  const [editorState, updateEditorState] = React.useState(initialState)

  const editor = React.useMemo(
    () => withPagination({})(withRectangleSelect(withNodeId(withReact(createEditor())))),
    []
  )

  const createComponent = async () => {
    const { selectedNodeIds } = editor
    const componentId = shortid.generate()

    selectedNodeIds.forEach(page => {
      const { content, pageIndex, start, end } = getSelectedRange({
        editor,
        pageId: page.get('id'),
        nodeIds: page.get('nodeIds').toJS()
      })

      selectRange({ editor, pageIndex, start, end })

      Transforms.wrapNodes(editor, {
        type: 'component',
        id: componentId,
        componentId: componentId,
        children: content,
      })
    })
  }

  const renderElement = React.useCallback(
    ({ element, children, attributes }) => {
      if (element.type === 'page') {
        return (
          <Page
            id={element.id}
            content={children}
            attributes={attributes}
          />
        )
      }

      if (element.type === 'component') {
        return (
          <Component
            id={element.id}
            content={children}
            attributes={attributes}
          />
        )
      }

      return (
        <p
          data-node-id={element.id}
          style={{ backgroundColor: 'lightblue', margin: 0 }}
          {...attributes}
        >
          {children}
        </p>
      )
    },
    []
  )

  return (
    <React.Fragment>
      <GlobalStyles />
      <button onClick={createComponent}>Create component</button>

      <div data-start="selection" style={{ padding: 50, border: '1px solid black' }}>
        <Slate
          editor={editor}
          value={editorState}
          onChange={updateEditorState}
        >
          <Editable renderElement={renderElement} />
        </Slate>
      </div>
    </React.Fragment>
  )
}
