export type GraphType =
  "deaths" | "kills" | "clear types" | "PPS distribution" | "well columns"
  | "spin efficiency" | "attack per line" | "phase PPS" | "phase APM" | "attack recieved"
  | "downstacking" | "attack cheesiness" | "surge" | "PPS"

export const ORDERED_GRAPH_TYPES: GraphType[] = ["deaths", "kills", "clear types", "PPS distribution", "well columns"
  , "spin efficiency", "attack per line", "phase PPS", "phase APM", "attack recieved"
  , "downstacking", "attack cheesiness", "surge", "PPS"]
