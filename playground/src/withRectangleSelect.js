import Selection from '@simonwep/selection-js'
import { List, OrderedMap, Map } from 'immutable'

const withSelectRectangle = (editor) => {
  const onBeforeStart = ({ oe }) => oe.target.getAttribute('data-start') === 'selection'

  const onStart = () => {
    if (editor.selectedNodeIds) {
      editor
        .selectedNodeIds
        .map(nodeId => document.querySelector(`[data-node-id="${nodeId}"]`))
        .forEach(element => element.classList.remove('selected'))
      document
        .querySelector(`[data-page-id="${editor.selectedPageId}"]`)
        .classList
        .remove('selected')

      editor.selectedNodeIds = undefined
      editor.selectedPageId = undefined
    }
  }

  const onMove = ({ changed: { added, removed } }) => {
    for (const el of added) el.classList.add('selected')
    for (const el of removed) el.classList.remove('selected')
  }

  const onStop = ({ selected }) => {
    const selectedNodes = Array.from(selected)
      .map(node => node.getAttribute('data-page-id')
        ? { pageId: node.getAttribute('data-page-id') }
        : { nodeId: node.getAttribute('data-node-id') })

    let ranges = new OrderedMap()

    selectedNodes.forEach(selectedNode => {
      if (selectedNode.pageId) {
        ranges = ranges.set(selectedNode.pageId, new Map({ id: selectedNode.pageId, nodeIds: new List() }))
        return
      }

      const lastPageId = ranges.last().get('id')
      ranges = ranges.updateIn(
        [lastPageId, 'nodeIds'],
        nodeIds => nodeIds.push(selectedNode.nodeId)
      )
    })

    editor.selectedNodeIds = ranges
  }

  Selection.create({
    class: 'selection-area',
    selectables: ['[data-slate-node=\'element\']'],
    startareas: ['[data-start=\'selection\']']
  })
    .on('beforestart', onBeforeStart)
    .on('start', onStart)
    .on('move', onMove)
    .on('stop', onStop)

  return editor
}

export default withSelectRectangle
