import { useState } from 'react'
import { DASHBOARD } from '../../data/dashboard'
import { Card, Chip, Icon, Skel, TONE, TextLink } from './shared'

/* ---------- Managers + policies ---------- */

export function ManagersCard({ managers, loading }: { managers: (typeof DASHBOARD)['busy']['managers']; loading: boolean }) {
  const [more, setMore] = useState(false)
  const list = more ? managers : managers.slice(0, 2)
  return (
    <Card title="My Managers and Position" aside={<TextLink>View Hierarchy</TextLink>} busy={loading}>
      {loading ? (
        <div className="flex items-center gap-3"><span className="size-10 animate-pulse rounded-full bg-grey-150" /><span className="flex flex-1 flex-col gap-2"><Skel className="h-3 w-1/2" /><Skel className="h-2.5 w-1/3" /></span></div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs leading-4 text-light-text">{managers.length > 1 ? `Reports to ${managers.length} managers` : 'Reports to'}</p>
          {managers.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-info-stroke bg-info-bg p-3 text-sm leading-5 text-info-dark">
              <Icon name="info" size={18} color="var(--color-info)" />
              No manager is assigned to you yet. Your admin can set one from your profile.
            </div>
          ) : (
            list.map((m) => (
              <a key={m.name} href="#" onClick={(e) => e.preventDefault()} className="-m-1 flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-grey-light">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-purple-bg text-sm font-semibold text-primary-dark">{m.initials}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm leading-5 font-semibold text-heading">{m.name}</span>
                  <span className="text-xs leading-4 text-light-text">{m.job}</span>
                </span>
                <Chip tone={{ bg: 'var(--color-grey-150)', stroke: 'var(--color-grey-200)', fg: 'var(--color-body-text)' }}>{m.unit}</Chip>
              </a>
            ))
          )}
          {managers.length > 2 && <TextLink onClick={() => setMore(!more)}>{more ? 'Show Less' : `Show ${managers.length - 2} More`}</TextLink>}
        </div>
      )}
      {!loading && (
        <div className="flex flex-col gap-2 border-t border-grey-200 pt-4">
          <p className="text-xs leading-4 text-light-text">Organization position</p>
          <p className="flex flex-wrap items-center gap-1.5 text-sm leading-5 text-body-text">
            Technology <Icon name="chev" size={14} color="var(--color-border-darker)" /> Engineering <Icon name="chev" size={14} color="var(--color-border-darker)" /> <span className="font-semibold text-heading">Mobile Team</span>
          </p>
        </div>
      )}
    </Card>
  )
}

export function PoliciesCard({ policies, loading }: { policies: (typeof DASHBOARD)['typical']['policies']; loading: boolean }) {
  return (
    <Card title="Policy Updates" sub="New and updated in the last 30 days" gap="gap-2" className="flex-1" busy={loading}>
      <div className="flex flex-col pt-2">
        {loading ? (
          [0, 1].map((i) => <Skel key={i} className="my-2 h-8" />)
        ) : policies.length === 0 ? (
          <p className="flex items-center gap-2.5 border-t border-grey-200 py-3 text-sm leading-5 text-light-text">
            <Icon name="check" size={18} color="var(--color-success)" />
            No policy changes in the last 30 days.
          </p>
        ) : (
          policies.map((p) => (
            <a key={p.title} href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 border-t border-grey-200 py-2.5 transition-colors hover:bg-grey-light">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm leading-5 font-medium text-heading">{p.title}</span>
                <span className="text-xs leading-4 text-light-text">{p.category} · {p.date.replace(',', '')}</span>
              </span>
              <Chip tone={p.tag === 'New' ? TONE.success : TONE.info}>{p.tag}</Chip>
            </a>
          ))
        )}
      </div>
      {!loading && <div className="mt-auto border-t border-grey-200 pt-2.5"><TextLink>Browse All 12 Policies</TextLink></div>}
    </Card>
  )
}
