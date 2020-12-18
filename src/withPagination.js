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
  console.log(editor.children)
  const lastPageIndex = editor.children.length - 1
  const lastNodeIndex = editor
    .children[lastPageIndex]
    .children
    .length - 1

  Transforms.removeNodes(editor, { at: [lastPageIndex, lastNodeIndex] })
  console.log('after removing node -> ', editor.children)
};

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
        const currNodeLine = childPath[1]

        if (height > pageMaxHeight) {
          const nextPage = editor.children[currPage + 1];

          if (!nextPage) {
            createNewPage({ editor, node, currPageIndex: currPage });
            return;
          }

          const node = editor
            .children[childPath[0]]
            .children[childPath[1]]
          const nodeText = node
            .children
            .map(curr => curr.text)
            .reduce((acc, curr) => acc + curr, '')

          if (nodeText && rowMeasurer(node) > 18) {
            Transforms.insertText(
              editor,
              nodeText.slice(0, nodeText.length - 10),
              { at: childPath }
            )
            Transforms.insertNodes(
              editor,
              { type: 'paragraph', id: shortid.generate(), children: [{ text: nodeText.slice(nodeText.length - 10) }] },
              { at: [childPath[0] + 1, 0] }
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
                path: [childPath[0] + 1, 0, 0],
                offset: 10,
              },
              focus: {
                path: [childPath[0] + 1, 0, 0],
                offset: 10,
              },
            })
          } else {
            console.log('inside else case !!')
            Transforms.moveNodes(editor, {
              at: childPath,
              to: [childPath[0] + 1, 0]
            });
          }

          console.log('after moving node -> ', editor.children)
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
