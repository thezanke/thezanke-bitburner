import { HOME, PURCHASED_SERVER_PREFIX } from '/scripts/constants.js';
import { findServers } from '/scripts/helpers/find-servers.js';
import { killAllPayloads } from '/scripts/helpers/kill-all-payloads.js';

const PAYLOAD_SCRIPT = '/scripts/share.js';

/**
 * @param {string[]} hostnames array of hostnames we're filtering through
 * @param {string} matcher a comma-separate list of hostnames. A trailing * on a hostname means to match using `startsWith`. For example, `pserv-*` would match all hostnames starting with "pserv-".
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
 * @param {string} workerPrefixes a comma-separated list of hostnames or hostname masks ending in an asterisk.
 * @param {{ignoreCluster: boolean}} flags
 **/
export const deployAndRun = async (ns, workerPrefixes, flags = {}) => {
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
    const threads = determineMaxServerThreads(ns, server);

    if (!threads) continue;
    if (workerHostname !== HOME) await ns.scp(PAYLOAD_SCRIPT, HOME, workerHostname);

    const pid = ns.exec(PAYLOAD_SCRIPT, workerHostname, threads);

    if (!pid) {
      ns.tprint(`Failed to start ${PAYLOAD_SCRIPT} on ${workerHostname} with ${threads} threads`);
      continue;
    }

    ns.tprint(`Started ${PAYLOAD_SCRIPT} on ${workerHostname} with ${threads} threads`);
  }
};

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const [workerPrefixes] = ns.args;
  const flags = ns.flags([['ignoreCluster', false]]);

  return deployAndRun(ns, workerPrefixes, flags);
}

export const autocomplete = (data) => data.servers;
