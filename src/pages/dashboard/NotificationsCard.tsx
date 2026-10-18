import { useState } from 'react'
import { type DashNote } from '../../data/dashboard'
import { Card, Dot, Empty, Icon, NOTE_ICON, Skel, TextLink } from './shared'

/* ---------- Notifications ---------- */

export function NotificationsCard({ notes, total, loading, fail, onRetry, read, setRead, totalUnread }: { notes: DashNote[]; total: number; loading: boolean; fail: boolean; onRetry: () => void; read: Record<string, boolean>; setRead: (r: Record<string, boolean>) => void; totalUnread: number }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const isRead = (n: DashNote, id = n.id) => !!n.read || !!read[id]
  const urgent = notes.filter((n) => n.urgent).slice(0, 3)
  const rest = notes.filter((n) => !n.urgent).slice(0, 5 - urgent.length)
  const shown = [...urgent, ...rest]
  const shownUnread = shown.reduce((s, n) => s + (n.children ? n.children.filter((c) => !isRead(n, c.id)).length : isRead(n) ? 0 : 1), 0)
  const mark = (ids: string[]) => setRead({ ...read, ...Object.fromEntries(ids.map((id) => [id, true])) })
  const foot = totalUnread > shownUnread ? [`${shownUnread} of ${totalUnread} unread shown`, 'View All Unread'] : total > shown.length ? [`Showing the latest ${shown.length} of ${total}`, 'View All'] : null

  const Row = ({ n }: { n: DashNote }) => {
    const group = !!n.children?.length
    const r = group ? n.children!.every((c) => isRead(n, c.id)) : isRead(n)
    const expanded = !!open[n.id]
    const ic = n.urgent && !r ? { icon: NOTE_ICON[n.type].icon, bg: 'var(--color-danger-bg)', stroke: 'var(--color-danger-stroke)', fg: 'var(--color-danger)' } : NOTE_ICON[n.type]
    const inner = (
      <>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border" style={{ background: ic.bg, borderColor: ic.stroke }}><Icon name={ic.icon} color={ic.fg} /></span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
          <span className={`flex items-center gap-1.5 text-sm leading-5 text-heading ${r ? 'font-medium' : 'font-semibold'}`}>
            {n.title}
            {group && <span className="rounded-full bg-grey-200 px-1.5 text-2xs leading-4 font-semibold text-body-text">{n.children!.length}</span>}
            {!r && <span className="sr-only">, unread</span>}
          </span>
          <span className="text-sm leading-5 text-body-text">{n.body}</span>
          <span className="text-xs leading-4 text-light-text">{n.when.replace(',', '')}</span>
        </span>
        {group && <Icon name="down" color="var(--color-light-text)" className={`mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
        <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full transition-colors ${r ? 'bg-transparent' : 'bg-primary'}`} />
      </>
    )
    return (
      <div className={`rounded-lg transition-colors ${r ? 'bg-white' : 'bg-row-hover'}`}>
        {group ? (
          <button type="button" aria-expanded={expanded} onClick={() => { setOpen({ ...open, [n.id]: !expanded }); mark(n.children!.map((c) => c.id)) }} className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-grey-light">
            {inner}
          </button>
        ) : (
          <a href="#" onClick={(e) => { e.preventDefault(); mark([n.id]) }} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-grey-light">
            {inner}
          </a>
        )}
        {group && expanded && (
          <div className="menu-in flex flex-col gap-0.5 pr-3 pb-2.5 pl-14">
            {n.children!.map((c) => (
              <span key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm leading-5">
                <Dot color={isRead(n, c.id) ? 'var(--color-border)' : 'var(--color-primary)'} size={6} />
                <span className="min-w-0 flex-1 text-heading">{c.title}</span>
                <span className="text-xs leading-4 whitespace-nowrap text-light-text">{c.when}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card
      id="dash-notes"
      className="h-full"
      gap="gap-3"
      busy={loading}
      title="Latest Updates"
    >
      {loading ? (
        [0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 p-3">
            <span className="size-2 shrink-0 rounded-full bg-grey-200" />
            <span className="flex flex-1 flex-col gap-2"><Skel className="h-3 w-1/2" /><Skel className="h-2.5 w-11/12" /><Skel className="h-2 w-1/4" /></span>
          </div>
        ))
      ) : fail ? (
        <div role="alert" className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-danger-stroke bg-danger-bg"><Icon name="alert" size={22} color="var(--color-danger)" /></span>
          <p className="text-base leading-6 font-semibold text-heading">Could Not Load Updates</p>
          <p className="text-sm leading-5 text-light-text">Something went wrong while loading updates. Please try again.</p>
          <button type="button" onClick={onRetry} className="mt-1 h-9 cursor-pointer rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-row-hover">Try Again</button>
        </div>
      ) : shown.length === 0 ? (
        <Empty icon="bell" tone="grey" title="No updates Yet" text="Updates about your goals, evaluation rounds and reports will appear here." />
      ) : (
        <>
          {urgent.length > 0 && <p className="px-1 pt-1 text-xs leading-4 font-semibold text-danger-dark">Needs Action</p>}
          {urgent.map((n) => <Row key={n.id} n={n} />)}
          {urgent.length > 0 && rest.length > 0 && <p className="px-1 pt-1 text-xs leading-4 font-semibold text-light-text">Latest</p>}
          {rest.map((n) => <Row key={n.id} n={n} />)}
          {foot && (
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-grey-200 pt-2.5">
              <span className="text-xs leading-4 text-light-text">{foot[0]}</span>
              <TextLink>{foot[1]}</TextLink>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
