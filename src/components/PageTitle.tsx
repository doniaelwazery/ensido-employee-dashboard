/** DS "Page Title": the page heading under the top bar (12px vertical padding, H4 24/36). */
export function PageTitle({ title }: { title: string }) {
  return (
    <div className="flex flex-col bg-body-bg py-3">
      <h1 className="text-xl leading-7.5 font-semibold text-heading sm:text-2xl sm:leading-9">{title}</h1>
    </div>
  )
}
