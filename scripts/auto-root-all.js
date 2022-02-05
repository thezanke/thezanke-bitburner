import { HOME, PURCHASED_SERVER_PREFIX } from '/scripts/constants.js';
import { findServers } from '/scripts/helpers/find-servers.js';

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const servers = findServers(ns, (s) => s !== HOME && !s.startsWith(PURCHASED_SERVER_PREFIX));
  const tools = [ns.brutessh, ns.ftpcrack, ns.relaysmtp, ns.httpworm, ns.sqlinject, ns.nuke];

  ns.tprint(`Auto-rooting ${servers.length} servers. Please wait...`);

  while (servers.length) {
    for (let i = servers.length - 1; i >= 0; i -= 1) {
      const server = servers[i];

      for (const tool of tools) {
        try {
          await tool(server);
        } catch {}
      }

      if (ns.hasRootAccess(server)) servers.splice(i, 1);
    }

    ns.print(`${servers.length} servers remaining.`);
    if (servers.length) await ns.sleep(10000);
  }

  ns.alert('All servers have been rooted! Exiting.');
}
