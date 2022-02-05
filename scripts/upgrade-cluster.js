import { deployAndRun } from '/scripts/deploy-and-hack.js';
import { getPreviousScriptTarget } from '/scripts/helpers/get-previous-script-target.js';
import { FORMAT_MONEY, HOME, PURCHASED_SERVER_PREFIX } from '/scripts/constants.js';

/**
 * @param {NS} ns
 * @param {string} hostname
 **/
const killAllAndDelete = (ns, hostname) => {
  try {
    ns.killall(hostname);
    ns.deleteServer(hostname);
  } catch {}
};

/**
 * @param {NS} ns
 * @param {string} hostname
 **/
const getCurrentRam = (ns, hostname) => {
  try {
    return ns.getServerMaxRam(hostname);
  } catch {
    return 0;
  }
};

/**
 * @param {NS} ns
 * @param {number} ram
 **/
const waitUntilCanAfford = async (ns, ram) => {
  const cost = ns.getPurchasedServerCost(ram);

  let canAfford;

  do {
    canAfford = ns.getServerMoneyAvailable(HOME) > cost;
    if (!canAfford) {
      ns.print(`Waiting for ${ns.nFormat(cost, FORMAT_MONEY)}`);
      await ns.sleep(5000);
    }
  } while (!canAfford);
};

/**
 * @param {NS} ns
 * @param {number} ram
 **/
const buildNewCluster = async (ns, ram) => {
  const limit = ns.getPurchasedServerLimit();

  const hostnames = Array.from({ length: limit }, (_, i) => `${PURCHASED_SERVER_PREFIX}${i}`);

  for (const hostname of hostnames) {
    if (getCurrentRam(ns, hostname) >= ram) continue;

    await waitUntilCanAfford(ns, ram);

    const previousTarget = getPreviousScriptTarget(ns, hostname);

    killAllAndDelete(ns, hostname);
    ns.purchaseServer(hostname, ram);

    if (previousTarget) await deployAndRun(ns, previousTarget, hostname);

    ns.tprint(`${hostname} purchased with ram: ${ram}.`);
  }
};

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let ram = parseInt(ns.args[0] ?? 8);
  await buildNewCluster(ns, ram);
  ns.alert('Cluster upgrade complete!');
}
