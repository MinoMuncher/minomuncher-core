import { defaultRainbow } from "@/theme/colors"
import { GraphType } from "@/graphs/types"
import { ClearType, DeathTypes, PlayerCumulativeStats } from "./types"
import { scaleLinear, scaleSqrt } from "d3"
import { createMultiWellCols } from "./graphs/multiWellCols"
import { createOverflowStackedBar } from "./graphs/overflowStackedBar"
import { createMultiPPS } from "./graphs/ppsSegments"
import { radarAxis, createRadar } from "./graphs/radar"
import { createSankey } from "./graphs/sankey"
import { createSpeed } from "./graphs/speed"
import { StackedDataPoint, createStackedBar } from "./graphs/stackedBar"
import { createWellCols } from "./graphs/wellCols"

export function createGraph(rootDiv: HTMLElement, graphType: GraphType, stats: PlayerCumulativeStats) {
    if (graphType == "kills") {
        const keys: DeathTypes[] =
            [
                "Surge Conflict",
                "Surge Spike",
                "Cheese Spike",
                "Spike",
                "Cheese Pressure",
                "Pressure"
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.green,
                defaultRainbow.teal,
                defaultRainbow.violet,
                defaultRainbow.purple,
                defaultRainbow.pink,
                defaultRainbow.blue,
            ]
        colors.reverse()

        const shortName = (k: DeathTypes) => {
            if (k == "Surge Spike") {
                return "Surge"
            } else if (k == "Cheese Pressure") {
                return "Cheese"
            }
            return k
        }

        type ClearMap = { [key in DeathTypes]: number }

        const data: StackedDataPoint<ClearMap>[] = []
        for (const key in stats) {
            data.push({
                category: stats[key].username,
                stat: stats[key].stats.killStats
            })
        }
        createStackedBar<ClearMap>(rootDiv, "Kills", data, keys, colors, shortName)
    }

    else if (graphType == "deaths") {
        const keys: DeathTypes[] =
            [
                "Surge Conflict",
                "Surge Spike",
                "Cheese Spike",
                "Spike",
                "Cheese Pressure",
                "Pressure"
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.green,
                defaultRainbow.teal,
                defaultRainbow.violet,
                defaultRainbow.purple,
                defaultRainbow.pink,
                defaultRainbow.blue,
            ]
        colors.reverse()

        const shortName = (k: DeathTypes) => {
            if (k == "Surge Spike") {
                return "Surge"
            } else if (k == "Cheese Pressure") {
                return "Cheese"
            }
            return k
        }

        type ClearMap = { [key in DeathTypes]: number }

        const data: StackedDataPoint<ClearMap>[] = []
        for (const key in stats) {
            data.push({
                category: stats[key].username,
                stat: stats[key].stats.deathStats
            })
        }
        createStackedBar<ClearMap>(rootDiv, "Deaths", data, keys, colors, shortName)
    }

    else if (graphType == "clear types") {
        const keys: ClearType[] =
            [
                "perfectClear",
                "allspin",
                "tspinTriple",
                "tspinDouble",
                "tspinSingle",
                "quad",
                "triple",
                "double",
                "single",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.green,
                defaultRainbow.teal,
                defaultRainbow.violet,
                defaultRainbow.purple,
                defaultRainbow.pink,
                defaultRainbow.blue,
                defaultRainbow.orange,
                defaultRainbow.yellow,
                defaultRainbow.red,
            ]
        colors.reverse()

        const shortName = (k: ClearType) => {
            switch (k) {
                case "perfectClear": return "pc"
                case "tspinTriple": return "tst"
                case "tspinDouble": return "tsd"
                case "tspinSingle": return "tss"
                default: return k as string
            }
        }

        type ClearMap = { [key in ClearType]: number }

        const data: StackedDataPoint<ClearMap>[] = []
        for (const key in stats) {
            data.push({
                category: stats[key].username,
                stat: stats[key].stats.clearTypes
            })
        }
        createStackedBar<ClearMap>(rootDiv, "Lineclear Distribution", data, keys, colors, shortName)
    }

    else if (graphType == "PPS distribution") {
        const data: number[][] = []
        const names = []
        for (const key in stats) {
            data.push(stats[key].stats.ppsSegments)
            names.push(stats[key].username)
        }

        createMultiPPS(rootDiv, "Placement PPS", names, data.map(x => {
            const y = new Array(50).fill(0)
            for (let i = 0; i < x.length; i++) {
                y[Math.floor(i / 2)] += x[i] * 100
            }
            return y
        }))
    }

    else if (graphType == "well columns") {
        const data: number[][] = []
        const names = []
        for (const key in stats) {
            data.push(stats[key].stats.wellColumns)
            names.push(stats[key].username)
        }
        if (data.length > 1) {
            createMultiWellCols(rootDiv, "Well Columns", names, data.map(x => {
                let sum = 0
                for (const v of x) { sum += v }
                for (let i = 0; i < x.length; i++) {
                    x[i] = x[i] / sum * 100
                }
                return x
            }))
        } else {
            createWellCols(rootDiv, "Well Columns", names[0], data[0])
        }
    }

    else if (graphType == "spin efficiency") {
        type StatMap = {
            allspinEfficiency: number
            tEfficiency: number
            iEfficiency: number
        }
        const keys: (Extract<keyof StatMap, string>)[] =
            [
                "allspinEfficiency",
                "tEfficiency",
                "iEfficiency",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.green,
                defaultRainbow.purple,
                defaultRainbow.blue,
            ]
        colors.reverse()

        const shortName = (k: Extract<keyof StatMap, string>) => {
            switch (k) {
                case "allspinEfficiency": return "allspinEff"
                case "tEfficiency": return "tspinEff"
                case "iEfficiency": return "quadEff"
                default: return k as string
            }
        }


        const data: StackedDataPoint<StatMap>[] = []
        for (const key in stats) {
            data.push({
                category: stats[key].username,
                stat: {
                    allspinEfficiency: (Math.round(stats[key].stats.allspinEfficiency * 100)),
                    tEfficiency: (Math.round(stats[key].stats.tEfficiency * 100)),
                    iEfficiency: (Math.round(stats[key].stats.iEfficiency * 100)),
                }
            })
        }
        createOverflowStackedBar<StatMap>(rootDiv, "", data, 90, keys, colors, shortName, 30)
    }

    else if (graphType == "attack per line") {
        type StatMap = {
            cheeseAPL: number
            downstackAPL: number
            upstackAPL: number
        }
        const keys: (Extract<keyof StatMap, string>)[] =
            [
                "cheeseAPL",
                "downstackAPL",
                "upstackAPL",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.yellow,
                defaultRainbow.red,
                defaultRainbow.green,
            ]
        colors.reverse()

        const shortName = (k: Extract<keyof StatMap, string>) => {
            switch (k) {
                case "cheeseAPL": return "cheese APL"
                case "downstackAPL": return "downstack APL"
                case "upstackAPL": return "upstack APL"
                default: return k as string
            }
        }


        const data: StackedDataPoint<StatMap>[] = []
        for (const key in stats) {
            data.push({
                category: stats[key].username,
                stat: {
                    cheeseAPL: (Math.round(stats[key].stats.cheeseAPL * 100) / 100),
                    downstackAPL: (Math.round(stats[key].stats.downstackAPL * 100) / 100),
                    upstackAPL: (Math.round(stats[key].stats.upstackAPL * 100) / 100),
                }
            })
        }
        createOverflowStackedBar<StatMap>(rootDiv, "", data, 1.2 * 3, keys, colors, shortName, 0.5)
    }

    else if (graphType == "phase PPS") {
        type StatMap = {
            openerPPS: number
            PPS: number
            midgamePPS: number
        }
        const keys: (Extract<keyof StatMap, string>)[] =
            [
                "openerPPS",
                "PPS",
                "midgamePPS",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.yellow,
                defaultRainbow.red,
                defaultRainbow.green,
            ]
        colors.reverse()

        const shortName = (k: Extract<keyof StatMap, string>) => {
            switch (k) {
                case "openerPPS": return "opener"
                case "PPS": return "overall"
                case "midgamePPS": return "midgame"
                default: return k as string
            }
        }


        const data: StackedDataPoint<StatMap>[] = []
        for (const key in stats) {
            data.push({
                category: stats[key].username,
                stat: {
                    openerPPS: (Math.round(stats[key].stats.openerPPS * 100) / 100),
                    PPS: (Math.round(stats[key].stats.PPS * 100) / 100),
                    midgamePPS: (Math.round(stats[key].stats.midgamePPS * 100) / 100),
                }
            })
        }
        createOverflowStackedBar<StatMap>(rootDiv, "PPS", data, 2.5 * 3, keys, colors, shortName, 0.9)
    }


    else if (graphType == "phase APM") {
        type StatMap = {
            openerAPM: number
            APM: number
            midgameAPM: number
        }
        const keys: (Extract<keyof StatMap, string>)[] =
            [
                "openerAPM",
                "APM",
                "midgameAPM",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.yellow,
                defaultRainbow.red,
                defaultRainbow.green,
            ]
        colors.reverse()

        const shortName = (k: Extract<keyof StatMap, string>) => {
            switch (k) {
                case "openerAPM": return "opener"
                case "APM": return "overall"
                case "midgameAPM": return "midgame"
                default: return k as string
            }
        }


        const data: StackedDataPoint<StatMap>[] = []
        for (const key in stats) {
            data.push({
                category: stats[key].username,
                stat: {
                    openerAPM: (Math.round(stats[key].stats.openerAPM)),
                    APM: (Math.round(stats[key].stats.APM)),
                    midgameAPM: (Math.round(stats[key].stats.midgameAPM)),
                }
            })
        }
        createOverflowStackedBar<StatMap>(rootDiv, "APM", data, 300, keys, colors, shortName, 37.5)
    }


    else if (graphType == "attack recieved") {
        type NodeName = "IncomingAttacks" | "Cheese" | "Clean" | "Cancelled" | "CheeseTanked" | "CleanTanked"
        const indexedNodeNames: NodeName[] = ["IncomingAttacks", "Cheese", "Clean", "Cancelled", "CheeseTanked","CleanTanked"]

        function color(nodeName: NodeName, targetNodeName: NodeName) {
            if (targetNodeName == "CleanTanked") {
                return defaultRainbow.green
            }
            else if (targetNodeName == "CheeseTanked") {
                return defaultRainbow.red
            }
            else if (targetNodeName == "Cancelled") {
                if (nodeName == "Cheese") {
                    return defaultRainbow.teal
                } else {
                    return defaultRainbow.yellow
                }
            }
            if (targetNodeName == "Cheese") {
                return defaultRainbow.purple
            }
            else if (targetNodeName == "Clean") {
                return defaultRainbow.pink
            }
            return defaultRainbow.teal
        }

        const data: { name: string; links: { source: number; target: number; value: number; }[]; }[] = []

        for (const key in stats) {
            if (!(stats[key].stats.cheeseLinesRecieved + stats[key].stats.cleanLinesRecieved > 0)) continue
            const s = stats[key].stats
            data.push({
                name: stats[key].username,
                links: [
                    {
                        source: 0, target: 1,
                        value: (Math.round(s.cheeseLinesRecieved * 100))
                    },
                    {
                        source: 0, target: 2,
                        value: (Math.round(s.cleanLinesRecieved * 100))
                    },
                    {
                        source: 1, target: 3,
                        value: (Math.round(s.cheeseLinesCancelled * 100))
                    },
                    {
                        source: 1, target: 4,
                        value: (Math.round(s.cheeseLinesTanked * 100))
                    },
                    {
                        source: 2, target: 3,
                        value: (Math.round(s.cleanLinesCancelled * 100))
                    },
                    {
                        source: 2, target: 4,
                        value: (Math.round(s.cleanLinesTankedAsCheese * 100))
                    },
                    {
                        source: 2, target: 5,
                        value: (Math.round(s.cleanLinesTankedAsClean * 100))
                    },
                ]
            })
        }
        createSankey<NodeName>(rootDiv, data, indexedNodeNames, color)
    }


    else if (graphType == "downstacking") {
        const labels = [
            {
                label: "upstacker",
                color: defaultRainbow.teal
            },
            {
                label: "aggressive",
                color: defaultRainbow.green
            },
            {
                label: "medium",
                color: defaultRainbow.yellow
            },
            {
                label: "defensive",
                color: defaultRainbow.orange
            },
            {
                label: "downstacker",
                color: defaultRainbow.red
            }
        ]

        const data: number[] = []
        const names = []
        for (const key in stats) {
            if (!Number.isFinite(stats[key].stats.downstackingRatio)) continue
            data.push(Math.round(stats[key].stats.downstackingRatio * 100))
            names.push(stats[key].username)
        }

        createSpeed(rootDiv, "Downstacking Ratio", data, names, 100, [0, 20, 40, 60, 80, 100], labels)
    }

    else if (graphType == "attack cheesiness") {
        const labels = [
            {
                label: "lean",
                color: defaultRainbow.teal
            },
            {
                label: "clean",
                color: defaultRainbow.green
            },
            {
                label: "medium",
                color: defaultRainbow.yellow
            },
            {
                label: "cheesy",
                color: defaultRainbow.orange
            },
            {
                label: "greasy",
                color: defaultRainbow.red
            }
        ]

        const data: number[] = []
        const names = []
        for (const key in stats) {
            if (!Number.isFinite(stats[key].stats.attackCheesiness)) continue
            data.push(Math.round(stats[key].stats.attackCheesiness * 100))
            names.push(stats[key].username)
        }

        createSpeed(rootDiv, "Attack Cheesiness", data, names, 100, [0, 20, 40, 60, 80, 100], labels)
    }


    else if (graphType == "surge") {

        const userData: number[][] = []
        const usernames: string[] = []

        for (const key in stats) {
            const ll = [
                (stats[key].stats.surgeAPM),
                (stats[key].stats.surgePPS),
                (stats[key].stats.surgeLength),
                (stats[key].stats.surgeRate * 100),
                (stats[key].stats.surgeSecsPerDS),
                (stats[key].stats.surgeSecsPerCheese)
            ]

            let ok = true
            for (const v of ll) {
                if (Number.isNaN(v)) {
                    ok = false
                    break
                }
            }

            if (ok) {
                usernames.push(stats[key].username)
                userData.push(ll)
            }
        }

        const axis: radarAxis[] = [
            {
                label: "APM",
                scale: scaleLinear([0, Math.max(300, (Math.max(...userData.map(x => x[0]))))], [0, 1]).clamp(true)
            },
            {
                label: "PPS",
                scale: scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[1]))))], [0, 1]).clamp(true)
            },
            {
                label: "Length",
                scale: scaleLinear([0, Math.max(10, (Math.max(...userData.map(x => x[2]))))], [0, 1]).clamp(true)
            },
            {
                label: "Conversion Rate",
                scale: scaleLinear([0, Math.max(15, (Math.max(...userData.map(x => x[3]))))], [0, 1]).clamp(true)
            },
            {
                label: "Sec/DS",
                scale: scaleSqrt([Math.max(20, (Math.max(...userData.map(x => x[4])))), 0], [0, 1]).clamp(true)
            },
            {
                label: "Sec/Cheese",
                scale: scaleSqrt([Math.max(40, (Math.max(...userData.map(x => x[5])))), 0], [0, 1]).clamp(true)
            },
        ]
        createRadar(rootDiv, "Surge", axis, userData, usernames)
    }

    else if (graphType == "PPS") {

        const userData: number[][] = []
        const usernames: string[] = []

        for (const key in stats) {
            const ll = [
                (stats[key].stats.PPS),
                (stats[key].stats.PlonkPPS),
                (stats[key].stats.upstackPPS),
                (stats[key].stats.PPSCoeff),
                (stats[key].stats.downstackPPS),
                (stats[key].stats.BurstPPS),
            ]

            let ok = true
            for (const v of ll) {
                if (Number.isNaN(v)) {
                    ok = false
                    break
                }
            }

            if (ok) {
                usernames.push(stats[key].username)
                userData.push(ll)
            }
        }

        const axis: radarAxis[] = [
            {
                label: "PPS",
                scale: scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[0]))))], [0, 1]).clamp(true)
            },
            {
                label: "Plonk PPS",
                scale: scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[1]))))], [0, 1]).clamp(true)
            },
            {
                label: "Upstack PPS",
                scale: scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[2]))))], [0, 1]).clamp(true)
            },
            {
                label: "PPS Variance",
                scale: scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[3]))))], [0, 1]).clamp(true)
            },
            {
                label: "Downstack PPS",
                scale: scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[4]))))], [0, 1]).clamp(true)
            },
            {
                label: "Burst PPS",
                scale: scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[5]))))], [0, 1]).clamp(true)
            },
        ]
        createRadar(rootDiv, "PPS", axis, userData, usernames)
    }
}