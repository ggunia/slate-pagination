const getPageDimensions = () => {
  const pageRef = document.querySelector('[data-page-id]:not([data-page-id=""])')
  const pageHeight = Number.parseInt(window
    .getComputedStyle(pageRef)
    .getPropertyValue('height')
    .replace('px', ''), 10)
  const pageWidth = Number.parseInt(window
    .getComputedStyle(pageRef)
    .getPropertyValue('width')
    .replace('px', ''), 10)

  return {
    pageHeight,
    pageWidth,
  }
}

export default getPageDimensions
