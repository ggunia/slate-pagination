import React from "react";

const styles = {
  root: {
    border: "1px solid black",
    padding: 5,
    height: 54,
    overflow: "hidden",
    position: "relative"
  }
};

const Page = React.forwardRef(({ attributes, id, content }, ref) => {
  return (
    <div
      ref={ref}
      style={styles.root}
      data-page-id={id}
      {...attributes}
    >
      {content}
    </div>
  );
});

export default Page;
