const rowMeasurer = ({ node, config, dimensions }) => { // eslint-disable-line
  if (node.type === 'paragraph') {
    const text = node
      .children
      .map(curr => curr.text)
      .reduce((acc, curr) => acc + curr, '')

    const span = document.createElement('span')
    span.setAttribute('style', `width: ${dimensions.pageWidth}px; display: block; word-break: break-all;`)
    span.innerHTML = text
    document.body.appendChild(span)

    const height = span.clientHeight
    document.body.removeChild(span)

    return Math.max(height, 18)
  }

  return 18
}

export default rowMeasurer
