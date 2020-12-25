import React from "react";
import { Slate, withReact, Editable } from "slate-react";
import { createEditor } from "slate";

import withPagination from "../../lib/withPaging";
import Page from "./Page";
import shortid from "shortid";

const initialState = [
  {
    type: "page",
    id: shortid.generate(),
    children: [
      {
        type: "paragraph",
        children: [{ text: "Some" }]
      },
    ]
  },
  {
    type: "page",
    id: shortid.generate(),
    children: [
      {
        type: "paragraph",
        children: [{ text: "Some" }]
      },
    ]
  },
];

export default function App() {
  const [editorState, updateEditorState] = React.useState(initialState);

  const editor = React.useMemo(
    () => withPagination({ pageHeight: 54, pageWidth: 470 })(withReact(createEditor())),
    []
  );

  const renderElement = React.useCallback(
    ({ element, children, attributes }) => {
      if (element.type === "page") {
        return (
          <Page id={element.id} content={children} attributes={attributes} />
        );
      }

      return (
        <p
          data-node-id={element.id}
          style={{ backgroundColor: 'lightblue', margin: 0 }}
          {...attributes}
        >
          {children}
        </p>
      );
    },
    []
  );

  const onEditorChange = (value) => {
    updateEditorState(value);
  };

  return (
    <div style={{ padding: 50, border: "1px solid black" }}>
      <Slate
        editor={editor}
        value={editorState}
        onChange={onEditorChange}
        operations={[]}
      >
        <Editable renderElement={renderElement} />
      </Slate>
    </div>
  );
}
