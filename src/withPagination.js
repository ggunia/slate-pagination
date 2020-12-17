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
        if (childPath[1] > 2) {
          const isLast = childPath[0] === editor.children.length - 1;
          const nextPage = editor.children[childPath[0] + 1];
          const currPageIndex = path[0];

          if (isLast || !nextPage) {
            createNewPage({ editor, currPageIndex });
            return;
          }

          Transforms.moveNodes(editor, {
            at: childPath,
            to: [childPath[0] + 1, 0]
          });
        }
      }
    }

    normalizeNode(entry);
  };

  return editor;
};

export default withPagination;
