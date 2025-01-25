export const Membership = {
  Unknown: -1,
  Liberal: 0,
  Fascist: 1,
  Hitler: 2,
} as const

export type Membership = typeof Membership[keyof typeof Membership];