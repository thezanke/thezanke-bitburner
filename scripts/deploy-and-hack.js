import { killAllPayloads } from '/scripts/helpers/kill-all-payloads.js';
import { HOME, PURCHASED_SERVER_PREFIX } from '/scripts/constants.js';
import { chunk } from '/scripts/helpers/chunk.js';
import { findServers } from '/scripts/helpers/find-servers.js';

const PAYLOAD_SCRIPT = '/scripts/hack.js';
const HARD_THREAD_LIMIT = 1000;
const MAX_MONEY_CHUNK_RATIO = 0.07;
const CHUNK_SLEEP_TIME = 10;

/**
 * @param {string[]} hostnames array of hostnames we're filtering through
 * @param {string} matcher a comma-separate list of hostnames. A trailing * on a
 * hostname means to match using `startsWith`. For example, `pserv-*` would match
 * all hostnames starting with "pserv-".
 **/
const determineMatchingHostnames = (hostnames, matcher) => {
  if (!matcher) return hostnames;

  matcher = matcher.split(',');

  return hostnames.filter((hostname) =>
    matcher.some((specifier) => {
      if (specifier[specifier.length - 1] === '*') {
        return hostname.startsWith(specifier.slice(0, specifier.length - 2));
      }

      return hostname === specifier;
    })
  );
};

/**
 * @param {NS} ns
 * @param {Server} server
 **/
const determineMaxServerThreads = (ns, server) => {
  const ramCost = ns.getScriptRam(PAYLOAD_SCRIPT, 'home');

  return Math.floor(server.maxRam / ramCost);
};

/**
 * @param {NS} ns
 * @param {string} target
 * @param {number} amount A number between 0 and 1
 **/
const determineThreadsNeeded = (ns, target, amount = 1) => {
  return 500;
  const moneyAvailable = Math.floor(ns.getServerMoneyAvailable(target)) || 1;
  const maxMoney = Math.floor(ns.getServerMaxMoney(target));
  const availableRatio = maxMoney / moneyAvailable;
  let threadsForAvailable = Math.floor(ns.hackAnalyzeThreads(target, moneyAvailable));
  if (threadsForAvailable < 1) threadsForAvailable = 1;

  // ns.tprint({ moneyAvailable, maxMoney, availableRatio, threadsForAvailable });

  return Math.floor(threadsForAvailable * availableRatio * amount) || 1;
};

/**
 * @param {NS} ns
 * @param {number} maxServerThreads
 * @param {string} target
 **/
const determineThreadCount = (ns, maxServerThreads, target) => {
  let limit = determineThreadsNeeded(ns, target, MAX_MONEY_CHUNK_RATIO);
  if (limit > HARD_THREAD_LIMIT) limit = HARD_THREAD_LIMIT;
  if (limit > maxServerThreads) limit = maxServerThreads;

  return limit;
};

/**
 * @param {NS} ns
 * @param {string} targetHostname the hostname of the server to target
 * @param {string} workerPrefixes a comma-separated list of hostnames or hostname masks ending in an asterisk.
 * @param {{ignoreCluster: boolean}} flags
 **/
export const deployAndRun = async (ns, targetHostname, workerPrefixes, flags = {}) => {
  const allHosts = findServers(ns);
  const workers = determineMatchingHostnames(allHosts, workerPrefixes);

  for (const workerHostname of workers) {
    if (flags.ignoreCluster && workerHostname.startsWith(PURCHASED_SERVER_PREFIX)) continue;

    const { hasAdminRights } = ns.getServer(workerHostname);

    if (!hasAdminRights) {
      ns.print(`No admin rights on ${workerHostname}, skipping!`);
      continue;
    }

    killAllPayloads(ns, workerHostname);

    const server = ns.getServer(workerHostname);

    const maxServerThreads = determineMaxServerThreads(ns, server);

    if (!maxServerThreads) continue;

    let threads = determineThreadCount(ns, maxServerThreads, targetHostname);

    if (workerHostname !== HOME) await ns.scp(PAYLOAD_SCRIPT, HOME, workerHostname);

    const processes = Array.from({ length: Math.floor(maxServerThreads / threads) }, (_, n) => n);

    let deployed = 0;
    for (const c of chunk(processes, 3000)) {
      for (const i of c) {
        const pid = ns.exec(PAYLOAD_SCRIPT, workerHostname, threads, targetHostname, i);

        if (!pid) {
          ns.tprint(
            `Failed to start ${PAYLOAD_SCRIPT} against ${targetHostname} on ${workerHostname} with ${threads} threads`
          );
          continue;
        }

        deployed += 1;
      }

      await ns.sleep(CHUNK_SLEEP_TIME);
    }

    ns.tprint(
      `${deployed}x Started ${PAYLOAD_SCRIPT} against ${targetHostname} on ${workerHostname} with ${threads} threads`
    );
  }
};

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const [targetHostname, workerPrefixes] = ns.args;
  const flags = ns.flags([['ignoreCluster', false]]);

  return deployAndRun(ns, targetHostname, workerPrefixes, flags);
}

export const autocomplete = (data) => data.servers;
