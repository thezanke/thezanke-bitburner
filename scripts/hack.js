const BATCH_SLEEP_LIMIT = 5 * 60 * 1000 + 10000;

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  var [target, num] = ns.args;

  var moneyThresh = ns.getServerMaxMoney(target) * 0.75;
  var securityThresh = ns.getServerMinSecurityLevel(target) + 5;

  if (num) await ns.sleep((num * 10000) % BATCH_SLEEP_LIMIT);

  while (true) {
    if (ns.getServerSecurityLevel(target) > securityThresh) {
      await ns.weaken(target);
    } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
      await ns.grow(target);
    } else {
      await ns.hack(target);
    }
  }
}
