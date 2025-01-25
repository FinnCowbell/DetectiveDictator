export function css(...args: (string | { [key: string]: boolean })[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "string") {
        return arg;
      } else {
        return Object.entries(arg)
          .map(([key, value]) => (value ? key : ""))
          .join(" ");
      }
    })
    .join(" ");
}