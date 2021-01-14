import React from 'react'
import { Slate, withReact, Editable } from 'slate-react'
import { createEditor, Transforms } from 'slate'
import { createGlobalStyle } from 'styled-components'
import * as sharedb from 'sharedb/lib/client'
import * as jsondiff from 'json0-ot-diff'
import shortid from 'shortid'

import withPagination from '../../lib/withPaging'
import { getSelectedRange, selectRange } from './editorUtils'
import withRectangleSelect from './withRectangleSelect'
import api from './api'
import withNodeId from './withNodeId'
import Page from './Page'
import Component from './Component'
import useCursors from './useCursors'

const ws_client = new WebSocket('ws://localhost:8000')

const sectionId = '7e8c4a6f-f84d-4b91-95eb-289bd51d38f8'
const userId = '7e8c4a6f-f84d-4b91-95eb-289bd51d38f8'

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
  console.log("🚀 ~ file: App.jsx ~ line 87 ~ App ~ editorState", editorState)
  const oldValue = React.useRef()
  const syncMutex = React.useRef()
  const componentsRef = React.useRef({})
  const oldSelection = React.useRef([{
    id: 'test',
    selection: { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } }
  }])

  const { setSelections } = useCursors({})
  
  const editor = React.useMemo(
    () => withPagination({})(withRectangleSelect(withNodeId(withReact(createEditor())))),
    []
  )

  const doc = React.useMemo(
    () => {
      const connection = new sharedb.Connection(ws_client)

      return connection.get('sections', sectionId)
    },
    []
  )

  const connectComponent = ({ componentId }) => {
    const connection = new sharedb.Connection(ws_client)

    return connection.get('components', componentId)
  }

  const createComponent = async () => {
    const { selectedNodeIds } = editor
    const componentId = shortid.generate()

    const newComponent = {
      type: 'component',
      id: componentId,
      componentId,
      children: []
    }

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

      newComponent.children = [...newComponent.children, ...content]
    })

    await api.createComponent({
      componentId,
      content: newComponent.children,
      sectionId
    })

    const componentCon = connectComponent({ componentId })

    componentCon.subscribe(onComponentSubscribe({ componentId }))
    componentCon.on('op', onComponentOperation({ componentId }))

    componentsRef.current[componentId] = componentCon
  }

  const onComponentSubscribe = ({ componentId }) => {
    const comp = componentsRef.current[componentId]

    syncMutex.current = true

    updateEditorState(comp.data.children)
    
    syncMutex.current = false
  }

  const onComponentOperation = ({ componentId }) => {
    const comp = componentsRef.current[componentId]

    syncMutex.current = true
    
    if (comp.data.selections) {
      const mySelection = comp
        .data
        .selections
        .find(currSelection => currSelection.id === userId)
      const otherSelections = comp
        .data
        .selections
        .filter(currSelection => currSelection.id !== userId)

      if (mySelection) editor.selection = mySelection.selection
      setSelections(otherSelections)
    }

    // find component and update
    updateEditorState(comp.data.children)

    syncMutex.current = false
  }

  React.useEffect(
    () => {
      const onSubscribe = () => {
        syncMutex.current = true
        updateEditorState(doc.data.children)
        syncMutex.current = false
      }

      const onOperation = () => {
        syncMutex.current = true

        if (doc.data.selections) {
          const mySelection = doc
            .data
            .selections
            .find(currSelection => currSelection.id === userId)
          const otherSelections = doc
            .data
            .selections
            .filter(currSelection => currSelection.id !== userId)

          if (mySelection) editor.selection = mySelection.selection
          setSelections(otherSelections)
        }

        updateEditorState(doc.data.children)
        syncMutex.current = false
      }

      doc.subscribe(onSubscribe)
      doc.on('op', onOperation)
    },
    [setSelections, doc]
  )

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

  const onEditorChange = (value) => {
    if (editor.selection) {
      const { focus: { path } } = editor.selection
      const node = editor
        .children[path[0]]
        .children[path[1]]

      if (node.type === 'component') {
        // get component content (which is inside node)
        // send updates to connected users
        // [line] -> [xPage, xComponentLine, [[line]] ]
      }


    }

    // Do document level collaboration
    updateEditorState(value)
  }

  const isComponentUpdate = () => {
    if (editor.selection) {
      const { focus: { path } } = editor.selection
      const node = editor
        .children[path[0]]
        .children[path[1]]

      if (node.type === 'component') return true
      return false
    }
    return false
  }

  const sendOp = args => new Promise(resolve => doc.submitOp(args, resolve))

  const handleComponentStateChange = () => {
    
  }

  const handleSectionStateChange = (newValue) => {
    oldValue.current = { selections: oldSelection.current, children: editorState }

    const selections = oldSelection
      .current
      .map(selection => selection.id === userId
        ? { id: userId, selection: editor.selection, color: '#000', name: 'saba' }
        : selection)

    const diff = jsondiff(oldValue, { selections, children: newValue })
    oldSelection.current = selections

    if (!syncMutex.current) {
      if (Array.isArray(diff) && diff.length) {
        sendOp(diff)
      }
    }
  }

  const onEditorStateChange = (newValue) => {
    const isComponent = isComponentUpdate()

    if (isComponent) {
      return handleComponentStateChange(newValue)
    }

    return handleSectionStateChange(newValue)
  }

  return (
    <React.Fragment>
      <GlobalStyles />
      <button onClick={createComponent}>Create component</button>

      <div data-start="selection" style={{ padding: 50, border: '1px solid black' }}>
        <Slate
          editor={editor}
          value={editorState}
          onChange={onEditorStateChange}
        >
          <Editable renderElement={renderElement} />
        </Slate>
      </div>
    </React.Fragment>
  )
}
