export const CardValue ={
  Liberal: 0,
  Fascist: 1,
}
export type CardValue = typeof CardValue[keyof typeof CardValue];