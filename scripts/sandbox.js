import { findIdealTargets } from '/scripts/find-ideal-targets';

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const servers = findIdealTargets(ns).map((s) => s.moneyMax);
  for (const s of servers) {
    console.log(s);
  }
}
