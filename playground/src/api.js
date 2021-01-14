import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/'
})

const createComponent = ({
  content,
  componentId,
  sectionId
}) => {
  return api.post('/component', {
    content,
    componentId,
    sectionId
  })
}

export default {
  createComponent
}