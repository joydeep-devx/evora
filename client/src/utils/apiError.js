// The backend sends errors as { message } on most routes and { error } on login.
export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error.response) return 'Could not reach the server. Check your connection and try again.'
  return error.response.data?.message || error.response.data?.error || fallback
}
