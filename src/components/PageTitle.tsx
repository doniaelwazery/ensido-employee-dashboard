import { type ReactNode } from 'react'

/** DS "Page Title": the page heading under the top bar (12px vertical padding, H4 24/36).
 *  Optional view tabs (My Dashboard / Company Dashboard) and a primary action on the right. */
export function PageTitle({ title, tabs, aside }: { title: string; tabs?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 bg-body-bg py-3">
      <h1 className="text-xl leading-7.5 font-semibold text-heading sm:text-2xl sm:leading-9">{title}</h1>
      {tabs}
      {aside && <div className="ml-auto flex items-center gap-3">{aside}</div>}
    </div>
  )
}
