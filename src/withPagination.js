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
  Transforms.insertNodes(
    editor,
    initialPage(),
    { at: [currPageIndex, editor.children[currPageIndex].children.length] }
  );

  const currPageLastIndex = editor.children[currPageIndex].children.length;

  Transforms.liftNodes(editor, { at: [currPageIndex, currPageLastIndex - 1] });
  Transforms.moveNodes(
    editor,
    {
      at: [currPageIndex, currPageLastIndex - 2],
      to: [currPageIndex + 1, 0]
    }
  )
  Transforms.removeNodes(
    editor, {
      at: [
        editor.children.length - 1,
        editor.children[editor.children.length - 1].children.length - 1
      ]
    }
  )
};

const withPagination = (editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (Element.isElement(node) && node.type === "page") {
      for (const [_, childPath] of Node.children(editor, path)) {
        const currPage = childPath[0]
        const currNodeLine = childPath[1]

        if (currNodeLine > 2) {
          const isLast = childPath[0] === editor.children.length - 1;
          const nextPage = editor.children[currPage + 1];

          if (isLast || !nextPage) {
            createNewPage({ editor, currPageIndex: currPage });
            return;
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
