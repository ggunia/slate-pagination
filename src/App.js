import React from "react";
import { Slate, withReact, Editable } from "slate-react";
import { createEditor } from "slate";
import { withHistory } from "slate-history";

import withPagination from "./withPagination";
import withNodeId from "./withNodeId";
import Page from "./Page";
import shortid from "shortid";

const initialState = [
  {
    type: "page",
    id: shortid.generate(),
    children: [
      {
        type: "paragraph",
        id: shortid.generate(),
        children: [{ text: "Some content here !!" }]
      },
    ]
  },
];

export default function App() {
  const [editorState, updateEditorState] = React.useState(initialState);

  const editor = React.useMemo(
    () => withHistory(withPagination(withNodeId(withReact(createEditor())))),
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
        <p style={{ position: "relative", margin: 0 }} {...attributes}>
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
    <div
      data-start="selection"
      className="mda"
      style={{ padding: 50, border: "1px solid black" }}
    >
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
