import shortid from 'shortid'

const withNodeId = (editor) => {
  const { apply } = editor

  editor.apply = (operation) => {
    if (operation.type === 'split_node' && operation.properties.type) {
      return apply({
        ...operation,
        properties: {
          ...operation.properties,
          id: shortid.generate(),
        }
      })
    }

    return apply(operation)
  }

  return editor
}

export default withNodeId
