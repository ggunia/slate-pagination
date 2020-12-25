import shortid from "shortid";
import { Transforms, Element, Node } from "slate";

const initialPage = () => ({
  type: "page",
  id: shortid.generate(),
  children: [
    {
      type: "paragraph",
      id: shortid.generate(),
      children: [{ text: "" }]
    }
  ]
});

const createNewPage = ({ editor, currPageIndex }) => {
  const lastIndex = editor
    .children[currPageIndex]
    .children
    .length

  Transforms.insertNodes(
    editor,
    initialPage(),
    { at: [currPageIndex, lastIndex] }
  );

  Transforms.liftNodes(editor, { at: [currPageIndex, lastIndex] });

  const lastPageIndex = editor.children.length - 1
  const lastNodeIndex = editor
    .children[lastPageIndex]
    .children
    .length - 1

  Transforms.removeNodes(editor, { at: [lastPageIndex, lastNodeIndex] })
};

const splitNode = ({ editor, path, nodeText }) => {
  let contentBeforeHeight = editor
    .children[path[0]]
    .children
    .slice(0, path[1])
    .reduce((acc, curr) => acc + rowMeasurer(curr), 0)
  let breakIndex = 0

  for (let i = 0; i < nodeText.length; i += 5) {
    const height = rowMeasurer({ type: 'paragraph', children: [{ text: nodeText.slice(0, i + 5) }] })

    if (contentBeforeHeight + height > 54) {
      breakIndex = i - 5
      break
    }
  }

  Transforms.insertText(
    editor,
    nodeText.slice(0, breakIndex),
    { at: path }
  )
  Transforms.insertNodes(
    editor,
    { type: 'paragraph', id: shortid.generate(), children: [{ text: nodeText.slice(breakIndex) }] },
    { at: [path[0] + 1, 0] }
  )
  Transforms.removeNodes(
    editor,
    {
      at: [
        editor.children.length - 1,
        editor.children[editor.children.length - 1].children.length - 1
      ]
    }
  )

  Transforms.setSelection(editor, {
    anchor: {
      path: [path[0] + 1, 0, 0],
      offset: nodeText.length - breakIndex,
    },
    focus: {
      path: [path[0] + 1, 0, 0],
      offset: nodeText.length - breakIndex,
    },
  })
}

const getNodeText = ({ node }) => {
  return node
    .children
    .map(curr => curr.text)
    .reduce((acc, curr) => acc + curr, '')
}

const rowMeasurer = (node) => {
  if (node.type === 'paragraph') {
    const text = node
      .children
      .map(curr => curr.text)
      .reduce((acc, curr) => acc + curr, '')

    const span = document.createElement('span')
    span.setAttribute('style', 'width: 470px; display: block; word-break: break-all;')
    span.innerHTML = text
    document.body.appendChild(span)

    const height = span.clientHeight
    document.body.removeChild(span)

    return Math.max(height, 18)
  }

  return 18
}

const withPaging = (editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (Element.isElement(node) && node.type === "page") {
      for (const [child, childPath] of Node.children(editor, path)) {
        const height = node
          .children
          .slice(0, childPath[1] + 1)
          .reduce((acc, curr) => acc + rowMeasurer(curr), 0)
        const pageMaxHeight = 54

        const currPage = childPath[0]

        if (height > pageMaxHeight) {
          const nextPage = editor.children[currPage + 1];

          if (!nextPage) {
            createNewPage({ editor, node, currPageIndex: currPage });
            return;
          }

          const nodeText = getNodeText({ node: child })

          if (nodeText && rowMeasurer(child) > 18) {
            splitNode({ editor, path: childPath, nodeText })
            return
          }

          Transforms.moveNodes(editor, {
            at: childPath,
            to: [childPath[0] + 1, 0]
          });
          return
        }
      }

      const nextPage = editor.children[path[0] + 1]

      if (!nextPage) {
        normalizeNode(entry)
        return
      }

      const content = nextPage.children
      const totalHeight = node
        .children
        .slice(0)
        .reduce((acc, curr) => acc + rowMeasurer(curr), 0)

      if (totalHeight < 54 && Boolean(content.length)) {
        Transforms.moveNodes(editor, {
          at: [path[0] + 1, 0],
          to: [path[0], node.children.length]
        })

        if (content.length === 1) {
          Transforms.removeNodes(editor, { at: [path[0] + 1] })
        }
      }
    }

    normalizeNode(entry);
  };

  return editor;
};

export default withPaging;
