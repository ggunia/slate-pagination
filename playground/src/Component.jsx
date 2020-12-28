import React from 'react'

const styles = {
  root: {
    backgroundColor: 'lightgreen',
  }
}

const Component = React.forwardRef(({ attributes, id, content }, ref) => { // eslint-disable-line
  return (
    <div
      ref={ref}
      style={styles.root}
      className="component"
      data-component-id={id}
      {...attributes}
    >
      {content}
    </div>
  )
})

Component.displayName = 'Component'

export default Component
