const getNodeText = ({ node }) => {
  return node
    .children
    .map(curr => curr.text)
    .reduce((acc, curr) => acc + curr, '')
}

export default getNodeText
