import { findServers } from '/scripts/helpers/find-servers.js';

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const allServers = findServers(ns);
  ns.tprint(JSON.stringify(allServers, null, 2));
}
