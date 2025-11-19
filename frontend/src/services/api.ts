import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

// Ready check
export const checkReady = async () => {
  const response = await api.get('/health/ready')
  return response.data
}

// Future API calls for HR platform
// export const getEmployees = async () => {
//   const response = await api.get('/api/v1/employees')
//   return response.data
// }

// export const getEmployee = async (id: number) => {
//   const response = await api.get(`/api/v1/employees/${id}`)
//   return response.data
// }

// export const createEmployee = async (data: any) => {
//   const response = await api.post('/api/v1/employees', data)
//   return response.data
// }

export default api



