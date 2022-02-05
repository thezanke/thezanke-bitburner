import { PAYLOAD_SCRIPTS } from '/scripts/constants.js';

/**
 * @param {NS} ns
 * @param {string} hostname
 **/
export const killAllPayloads = (ns, hostname) => {
  for (const payload of PAYLOAD_SCRIPTS) {
    try {
      const killed = ns.scriptKill(payload, hostname);
      if (killed) console.log(`Killed "${payload}" on ${hostname}`);
    } catch (e) {
      /* intentionally discarded error */
    }
  }
};
