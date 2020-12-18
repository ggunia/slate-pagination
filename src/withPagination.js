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
  Transforms.insertText(
    editor,
    nodeText.slice(0, nodeText.length - 10),
    { at: path }
  )
  Transforms.insertNodes(
    editor,
    { type: 'paragraph', id: shortid.generate(), children: [{ text: nodeText.slice(nodeText.length - 10) }] },
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
      offset: 10,
    },
    focus: {
      path: [path[0] + 1, 0, 0],
      offset: 10,
    },
  })
}

const getNodeText = ({ node }) => {
  return node
    .children
    .map(curr => curr.text)
    .reduce((acc, curr) => acc + curr, '')
}

const withPagination = rowMeasurer => (editor) => {
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

      if (node.children.length < 3 && Boolean(content.length)) {
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

export default withPagination;
