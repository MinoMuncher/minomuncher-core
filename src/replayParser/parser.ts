import { Engine, Mino } from "@haelp/teto/engine";
import { lockResultToRes } from "@/replayParser/lockResult";
import { addLockResultToPlacementStats } from "@/statLogic";
import { combineStats, newGameStats, PlayerGameStats } from "@/types";
import { engineConfig } from "@/replayParser/engineConfig";
import { type VersusReplay } from "@/replayParser/versusReplay";


import { TetrisDeathTracker } from "@/scorers/deathEngine";
import { StackSpeedScorer } from "@/scorers/stackSpeedScorer";
import { SurgeScorer } from "@/scorers/chainScorer";
import { CheeseScorer } from "@/scorers/cheeseScore";
export function parseReplay(
  replayString: string
): PlayerGameStats | undefined {
  let raw: VersusReplay | null = null;
  try {//descend into replay if needed
    let x = JSON.parse(replayString);
    while (true) {
      if ("replay" in x) {
        if ("replay" in x.replay) {
          x = x.replay;
        } else {
          raw = x;
          break;
        }
      } else {
        return undefined;
      }
    }
  } catch (e) {
    console.log("invalid replay", e);
    return;
  }
  if (raw == null) {
    return;
  }

  const cumulativeStatMap: PlayerGameStats = {};
  type GarbageChange = "cancel" | "tank" | "confirm";
  type GarbageEvent = {
    type: GarbageChange,
    change: number,
    id: number
  }

  for (let i = 0; i < raw.replay.rounds.length; i++) {
    const gameState: {
      [key: string]: {
        surgeScorer: SurgeScorer,
        cheeseScorer: CheeseScorer,
        stackSpeedScorer: StackSpeedScorer,
        deathEngine: TetrisDeathTracker,
        phase: "noG" | "comboing" | "midgame",
        cheeseOnBoard: boolean,
        realCheeseOnBoard: boolean,
        garbageOnBoard: boolean,
        toppedOut: boolean,
        lastGarbageCol: number,
        lastb2b: number,
        engine: Engine,
        garbageEvents: GarbageEvent[],
        pendingGarbages?: {
          id: number,
          cancelled: number,
          tanked: number,
          original: number
        }[],
        desynced: boolean,
        surgeFrames: number[],
        endedAlive: boolean
      }
    } = {}

    const statMap: PlayerGameStats = {};


    for (const round of raw.replay.rounds[i]) {
      let opponents: number[] = [];
      for (let event of round.replay.events) {
        if (event.data.data?.gameid != undefined) {
          if (!opponents.includes(event.data.data.gameid)) {
            opponents.push(event.data.data.gameid);
          }
        }
        if (event.data.data?.targets != undefined) {
          for (const target of event.data.data.targets) {
            if (!opponents.includes(target)) {
              opponents.push(target);
            }
          }
        }
      }
      if (!(round.id in statMap)) statMap[round.id] = { username: round.username, stats: newGameStats() }
      const engine = new Engine(engineConfig(round.replay.options, opponents))
      const state = {
        surgeScorer: new SurgeScorer(),
        cheeseScorer: new CheeseScorer(),
        stackSpeedScorer: new StackSpeedScorer(),
        deathEngine: new TetrisDeathTracker(),
        phase: "noG" as "noG" | "comboing" | "midgame",
        cheeseOnBoard: false,
        realCheeseOnBoard: false,
        garbageOnBoard: false,
        toppedOut: false,
        lastGarbageCol: -1,
        lastb2b: 0,
        engine,
        garbageEvents: [] as GarbageEvent[],
        pendingGarbages: [],
        desynced: false,
        surgeFrames: [] as number[],
        endedAlive: round.alive
      }

      gameState[round.id] = state;

      engine.events.on("falling.lock", (lockResult) => {
        if(lockResult.topout){
          state.toppedOut = true
        }
        const res = lockResultToRes(lockResult, engine);
        if (res.clearInfo != undefined) {
          const lastb2b = state.surgeScorer.btb;
          state.surgeScorer.addLineClear(
            statMap[round.id].stats.surge,
            res.clearInfo.clearType,
            res.clearInfo.BTBClear,
            res.clearInfo.attack.reduce((partialSum, a) => partialSum + a, 0),
            res.clearInfo.linesCleared,
            res.clearInfo.downstackCleared,
            res.frameDelay,
            state.garbageOnBoard,
            state.cheeseOnBoard
          );
          if (engine.stats.b2b == -1) {
            if (
              lastb2b >= 5 &&
              lockResult.rawGarbage.reduce((partialSum, a) => partialSum + a, 0) >= 4
            ) {
              state.surgeFrames.push(engine.frame);
            }
          }
        } else {
          state.surgeScorer.addStack(
            statMap[round.id].stats.surge,
            res.frameDelay,
            state.garbageOnBoard,
            state.cheeseOnBoard
          );
        }
        if (state.phase == "noG" && lockResult.garbageCleared > 0) {
          state.phase = "comboing";
        } else if (state.phase == "comboing" && lockResult.lines == 0) {
          state.phase = "midgame";
        }
        addLockResultToPlacementStats(
          statMap[round.id].stats.placement,
          res,
          state.phase != "midgame",
          state.cheeseScorer,
          state.cheeseOnBoard
        );
        {
          let garbageHeight = 0;
          let garbageColumn = -1;

          let garbageHeights = [];
          let newGarbageColumn = -1;
          let gEnd = 0;
          outer: for (let y = 0; y < engine.board.state.length; y++) {
            gEnd = y;
            let gCol = -1;
            for (let x = 0; x < engine.board.state[y].length; x++) {
              if (engine.board.state[y][x] === null) {
                gCol = x;
              } else if (
                engine.board.state[y][x] === "gb" ||
                engine.board.state[y][x] === Mino.GARBAGE
              ) {
                if (gCol != -1) {
                  break;
                }
              } else {
                break outer;
              }
            }
            if (gCol == garbageColumn) {
              garbageHeight += 1;
            } else {
              if (garbageHeight > 0) garbageHeights.push(garbageHeight);
              garbageHeight = 1;
              garbageColumn = gCol;
              newGarbageColumn = gCol;
            }
          }

          if (state.phase == "midgame") {
            if (lockResult.garbageCleared > 0) {
              if (newGarbageColumn != state.lastGarbageCol) {
                state.stackSpeedScorer.update(true, res.frameDelay);
                state.lastGarbageCol = newGarbageColumn;
              } else {
                state.stackSpeedScorer.update(false, res.frameDelay);
              }
            } else {
              state.stackSpeedScorer.update(
                res.clearInfo === undefined ? "upstack" : "clear",
                res.frameDelay
              );
            }
          }

          let stackHeight = 0;

          outer: for (let y = gEnd; y < engine.board.state.length; y++) {
            gEnd = y;
            let found = false;
            for (let x = 0; x < engine.board.state[y].length; x++) {
              if (engine.board.state[y][x] != null) {
                found = true;
                break;
              }
            }
            if (!found) {
              stackHeight += 1;
            } else {
              break;
            }
          }

          if (garbageHeight > 0) garbageHeights.push(garbageHeight);

          if (
            garbageHeights.length > 0 &&
            garbageHeights[garbageHeights.length - 1] < 4
          ) {
            state.cheeseOnBoard = true;
          } else {
            state.cheeseOnBoard = false;
          }

          let totalCheeseLines = 0;

          for (let i = garbageHeights.length - 1; i >= 0; i--) {
            if (garbageHeights[i] < 4) {
              totalCheeseLines += garbageHeights[i];
            } else {
              break;
            }
          }

          if (totalCheeseLines >= 4 && stackHeight <= 10) {
            state.realCheeseOnBoard = true;
          } else {
            state.realCheeseOnBoard = false;
          }

          if (garbageHeights.length == 0) {
            state.garbageOnBoard = false;
          } else {
            state.garbageOnBoard = true;
          }
        }
      });

      engine.events.on("garbage.cancel", (ev) => {
        state.garbageEvents.push({
          type: "cancel",
          change: ev.amount,
          id: ev.iid,
        });
      });
      engine.events.on("garbage.tank", (ev) => {
        state.garbageEvents.push({
          type: "tank",
          change: ev.amount,
          id: ev.iid,
        });
      });
      engine.events.on("garbage.receive", (ev) => {
        state.deathEngine.update(state.realCheeseOnBoard, ev.originalAmount, engine.frame);
        state.garbageEvents.push({
          type: "confirm",
          change: ev.originalAmount,
          id: ev.iid,
        });
        if (ev.originalAmount - ev.amount) {
          state.garbageEvents.push({
            type: "cancel",
            change: ev.originalAmount - ev.amount,
            id: ev.iid,
          });
        }
      });
    }
    for (const round of raw.replay.rounds[i]) {
      const events = round.replay.events;
      loop1: while (events.length > 0) {
        while (gameState[round.id].engine.frame < events[0].frame) {
          gameState[round.id].engine.tick([]);
        }
        let toTick: any[] = [];
        while (events[0].frame < gameState[round.id].engine.frame) {
          //sanity
          console.error("SANITY BROKEN ON REPLAY PARSE", events[0]);
          events.shift();
        }
        while (events[0].frame == gameState[round.id].engine.frame) {
          if (events[0].type == "end") {
            events.shift();
            break loop1;
          }
          toTick.push(events.shift());
        }
        gameState[round.id].engine.tick(toTick);

        if (gameState[round.id].toppedOut && events.length > 10) {
          gameState[round.id].desynced = true;
        }
      }
    }

    for (const id in gameState) {
      const state = gameState[id];

      state.stackSpeedScorer.clearCache();
      combineStats(statMap[id].stats.placement.stackSpeed, state.stackSpeedScorer.getStats())

      if (state.surgeScorer.btb >= 4)
        statMap[id].stats.placement.attack += state.surgeScorer.btb;
      state.surgeScorer.addCached(statMap[id].stats.surge);

      for (const id2 in gameState) {
        if (id2 != id) {
          for (const x of gameState[id2].surgeFrames) {
            state.deathEngine.updateSurgeReceived(x);
          }
        } else {
          for (const x of gameState[id2].surgeFrames) {
            state.deathEngine.updateSurgeSent(x);
          }
        }
      }

      const pendingGarbages: {
        id: number;
        cancelled: number;
        tanked: number;
        original: number;
      }[] = [];

      while (true) {
        let allFailed = true;
        let toTrim = [];

        for (let i = 0; i < state.garbageEvents.length; i++) {
          const event = state.garbageEvents[i];
          if (event.type == "confirm") {
            toTrim.push(i);
            allFailed = false;

            pendingGarbages.push({
              id: event.id,
              cancelled: 0,
              tanked: 0,
              original: event.change,
            });
          } else {
            const idx = pendingGarbages.findIndex((e) => e.id == event.id);
            if (idx >= 0) {
              toTrim.push(i);
              allFailed = false;

              if (event.type == "cancel") {
                pendingGarbages[idx].cancelled += event.change;
              } else {
                pendingGarbages[idx].tanked += event.change;
              }

              if (
                pendingGarbages[idx].cancelled +
                pendingGarbages[idx].tanked >=
                pendingGarbages[idx].original
              ) {
                const outgoing = pendingGarbages.splice(idx, 1)[0];

                statMap[id].stats.garbage.linesReceived += outgoing.original;

                if (outgoing.original >= 4) {
                  statMap[id].stats.garbage.cleanLinesRecieved +=
                    outgoing.original;
                } else {
                  statMap[id].stats.garbage.cheeseLinesRecieved +=
                    outgoing.original;
                }

                if (outgoing.original >= 4) {
                  statMap[id].stats.garbage.cleanLinesCancelled +=
                    outgoing.cancelled;
                  if (outgoing.tanked < 4) {
                    statMap[id].stats.garbage.cleanLinesTankedAsCheese +=
                      outgoing.tanked;
                  } else {
                    statMap[id].stats.garbage.cleanLinesTankedAsClean +=
                      outgoing.tanked;
                  }
                } else {
                  statMap[id].stats.garbage.cheeseLinesCancelled +=
                    outgoing.cancelled;
                  statMap[id].stats.garbage.cheeseLinesTanked +=
                    outgoing.tanked;
                }
              }
            }
          }
        }

        toTrim.reverse();
        for (const trim of toTrim) {
          state.garbageEvents.splice(trim, 1);
        }

        if (allFailed) {
          break;
        }
      }

      state.engine.events.removeAllListeners()

      if (!state.endedAlive) {
        const deathy = state.deathEngine.death(state.engine.frame);
        statMap[id].stats.death[deathy] += 1;
        for (const key in statMap) {
          if (key != id) {
            statMap[key].stats.kill[deathy] += 1;
          }
        }
      }
    }

    for (const id in gameState) {
      if(!gameState[id].desynced){
        if (!(id in cumulativeStatMap)) {
          cumulativeStatMap[id] = statMap[id];
        } else {
          combineStats(cumulativeStatMap[id]!.stats, statMap[id]!.stats)
        }
      }
    }
  }
  return cumulativeStatMap
}