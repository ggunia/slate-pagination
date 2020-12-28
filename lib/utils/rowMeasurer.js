const rowMeasurer = ({ node, config, dimensions }) => { // eslint-disable-line
  const nodeMeasurer = (nodeToMeasure) => {
    if (nodeToMeasure.type === 'paragraph') {
      const text = nodeToMeasure
        .children
        .map(curr => curr.text)
        .reduce((acc, curr) => acc + curr, '')

      const span = document.createElement('span')
      const styles = `
        width: ${dimensions.pageWidth}px;
        display: block;
        word-break: break-all;
      `
      span.setAttribute('style', styles)
      span.innerHTML = text
      document.body.appendChild(span)

      const height = parseFloat(window.getComputedStyle(span)
        .getPropertyValue('height')
        .replace('px', ''))
      document.body.removeChild(span)

      return Math.max(Math.floor(height), 18)
    }
  }

  if (node.type === 'paragraph') {
    return nodeMeasurer(node)
  }

  if (node.type === 'component') {
    const height = node.children.reduce((acc, child) => acc + nodeMeasurer(child), 0)
    console.log(height)
    return height
  }

  return 18
}

export default rowMeasurer