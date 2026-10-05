import { useEffect } from 'react'
import { useSite } from '../context/SiteContext'

// Sets the tab title to "Page · Site name" while the page is mounted.
export function useTitle(title) {
  const { settings } = useSite()
  useEffect(() => {
    document.title = title ? `${title} · ${settings.site_name ?? ''}` : (settings.site_name ?? document.title)
  }, [title, settings.site_name])
}
