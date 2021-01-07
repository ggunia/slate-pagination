import React from 'react'
import { Slate, withReact, Editable } from 'slate-react'
import { createEditor, Transforms } from 'slate'
import { createGlobalStyle } from 'styled-components'
import shortid from 'shortid'
import * as sharedb from 'sharedb/lib/client'
import * as jsondiff from 'json0-ot-diff'

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

const userId = Date.now()

const ws_client = new WebSocket('ws://localhost:8000/')
const connection = new sharedb.Connection(ws_client)

const doc = connection.get('sections', '0b3f31eb-c886-44fb-85d0-64b9cdfbdf27')
const comp = connection.get('components', 'OxyAEV8qR')

export default function App() {
  const syncMutex = React.useRef()
  const oldValue = React.useRef()
  const [editorState, updateEditorState] = React.useState(initialState)
  console.log("🚀 ~ file: App.jsx ~ line 90 ~ App ~ editorState", editorState)
  const [selections, setSelections] = React.useState([])

  const editor = React.useMemo(
    () => withPagination({})(withRectangleSelect(withNodeId(withReact(createEditor())))),
    []
  )

  const oldSelection = React.useRef([{
    id: userId,
    selection: { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } }
  }])

  React.useEffect(() => {
    const onSubscribe = () => {
      syncMutex.current = true
      updateEditorState(doc.data.children)
      console.log("🚀 ~ file: App.jsx ~ line 167 ~ onSubscribe ~ doc.data.children", doc.data.children)
      console.log('doc', doc.data)
      syncMutex.current = false
    }

    const onCompSubscribe = () => {
      syncMutex.current = true
      
      console.log('fffff', comp.data)
      
      syncMutex.current = false
    }

    const onOperation = () => {
      syncMutex.current = true
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
      updateEditorState(doc.data.children)
      syncMutex.current = false
    }

    const onCompOperation = () => {
      console.log('comp', comp.data.children)
      // syncMutex.current = true
      // const mySelection = doc
      //   .data
      //   .selections
      //   .find(currSelection => currSelection.id === userId)
      // const otherSelections = doc
      //   .data
      //   .selections
      //   .filter(currSelection => currSelection.id !== userId)

      // if (mySelection) editor.selection = mySelection.selection

      // setSelections(otherSelections)
      // updateEditorState(doc.data.children)
      // syncMutex.current = false
    }

    doc.subscribe(onSubscribe)
    comp.subscribe(onCompSubscribe)
    doc.on('op', onOperation)
    comp.on('op', onCompOperation)
  }, [])
  

  const createComponent = () => {
    const { selectedNodeIds } = editor

    selectedNodeIds.forEach(page => {
      const { content, pageIndex, start, end } = getSelectedRange({
        editor,
        pageId: page.get('id'),
        nodeIds: page.get('nodeIds').toJS()
      })

      selectRange({ editor, pageIndex, start, end })

      Transforms.wrapNodes(editor, {
        type: 'component',
        id: shortid.generate(),
        children: content,
      })
    })
  }

  // component did catch and history push previous editor state

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

  const sendOpToDoc = args => new Promise(resolve => doc.submitOp(args, resolve))

  const sendOpToComp = args => new Promise(resolve => comp.submitOp(args, resolve))

  const onEditorChange = (newValue) => {
    oldValue.current = { selections: oldSelection.current, children: editorState }

    const selections = oldSelection
      .current
      .map(selection => selection.id === userId
        ? { id: userId, selection: editor.selection, color: '#000', name: 'name' }
        : selection)

    const diff = jsondiff(oldValue, { selections, children: newValue })
    oldSelection.current = selections

    if (editor.selection) {
      console.log(editor.selection)
      const { focus: { path } } = editor.selection
      const node = editor
        .children[path[0]]
        .children[path[1]]

      if (node.type === 'component') {
        const oldNode = oldValue.current.children[path[0]].children[path[1]]
        if (oldNode.type !== 'component') {
          sendOpToDoc(diff)
        } else {
          const componentDiff = jsondiff({ current: comp.data.children }, { selections, children: node.children })
          if (!syncMutex.current && Array.isArray(componentDiff) && componentDiff.length) {
            sendOpToComp(componentDiff)
          }
        }

        console.log('edit in comp')
        
      } else {
        if (!syncMutex.current && Array.isArray(diff) && diff.length) {
          sendOpToDoc(diff)
        }
      }
    } else {
      if (!syncMutex.current && Array.isArray(diff) && diff.length) {
        sendOpToDoc(diff)
      }
    }
    
  }

  const onEditorChangee = (value) => {
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

  return (
    <React.Fragment>
      <GlobalStyles />
      <button onClick={createComponent}>Create component</button>

      <div data-start="selection" style={{ padding: 50, border: '1px solid black' }}>
        <Slate
          editor={editor}
          value={editorState}
          onChange={onEditorChange}
          operations={[]}
        >
          <Editable renderElement={renderElement} />
        </Slate>
      </div>
    </React.Fragment>
  )
}
