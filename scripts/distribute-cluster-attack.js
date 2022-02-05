import { PURCHASED_SERVER_PREFIX } from '/scripts/constants.js';
import { deployAndRun } from '/scripts/deploy-and-hack.js';
import { findIdealTargets } from '/scripts/find-ideal-targets.js';
import { getPreviousScriptTarget } from '/scripts/helpers/get-previous-script-target.js';

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const [maxDifficulty] = ns.args;
  const targets = findIdealTargets(ns, maxDifficulty);

  for (let i = 0, limit = ns.getPurchasedServerLimit(); i < limit; i += 1) {
    const hostname = `${PURCHASED_SERVER_PREFIX}${i}`;
    const target = targets[i % targets.length].hostname;
    const previousTarget = getPreviousScriptTarget(ns, hostname);
    if (target !== previousTarget) await deployAndRun(ns, target, hostname);
  }
}
