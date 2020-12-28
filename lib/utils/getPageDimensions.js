const getPageDimensions = () => {
  const pageRef = document.querySelector('[data-page-id]:not([data-page-id=""])')
  const pageHeight = window
    .getComputedStyle(pageRef)
    .getPropertyValue('height')
    .replace('px', '')
  const pageWidth = window
    .getComputedStyle(pageRef)
    .getPropertyValue('width')
    .replace('px', '')

  return {
    pageHeight: Math.ceil(parseFloat(pageHeight)),
    pageWidth: Math.ceil(parseFloat(pageWidth)),
  }
}

export default getPageDimensions
