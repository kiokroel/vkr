export function formatApiError(err) {
  const data = err?.response?.data

  if (!data) return 'Ошибка запроса'

  const detail = data.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    const passwordTooShort = detail.some(
      (x) =>
        x?.type === 'string_too_short' &&
        Array.isArray(x?.loc) &&
        x.loc.includes('password')
    )
    if (passwordTooShort) return 'Пароль должен быть минимум 6 символов'

    return detail
      .map((x) => {
        const field = Array.isArray(x?.loc) ? x.loc[x.loc.length - 1] : ''
        const msg = x?.msg || 'Ошибка валидации'
        return field ? `${field}: ${msg}` : msg
      })
      .join('\n')
  }

  return 'Ошибка запроса'
}
