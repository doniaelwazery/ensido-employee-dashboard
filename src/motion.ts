/**
 * Starts chart animations (.fill-x bars, .dash-ring rings, .reveal containers) only once they are
 * properly on screen, so charts below the fold build up while the user is looking at them.
 */
const SELECTOR = '.fill-x, .dash-ring, .reveal'

// Reloads start at the top instead of jumping back down mid-page (which would play charts during loading).
history.scrollRestoration = 'manual'

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      // isIntersecting can be true for a sliver; also accept elements too tall to ever reach 40% visible
      const enough = e.intersectionRatio >= 0.4 || (e.rootBounds != null && e.intersectionRect.height >= e.rootBounds.height * 0.4)
      if (!e.isIntersecting || !enough) continue
      ;(e.target as HTMLElement).dataset.inview = ''
      io.unobserve(e.target)
    }
  },
  // at least 40% visible and clear of the bottom 15% of the window
  { threshold: 0.4, rootMargin: '0px 0px -15% 0px' },
)

const watch = (root: ParentNode) => {
  if (root instanceof Element && root.matches(SELECTOR)) io.observe(root)
  root.querySelectorAll(SELECTOR).forEach((el) => io.observe(el))
}

new MutationObserver((records) => {
  for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && watch(n))
}).observe(document.documentElement, { childList: true, subtree: true })

watch(document)
