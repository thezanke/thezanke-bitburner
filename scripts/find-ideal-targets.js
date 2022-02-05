import { findServers } from '/scripts/helpers/find-servers.js';
import { FORMAT_MONEY } from '/scripts/constants.js';

/**
 * @param {NS} ns
 * @param {number} difficultyTarget
 * @param {number} growthTarget
 * **/
export const findIdealTargets = (ns, difficultyTarget = Infinity, growthTarget = Infinity) => {
  const serverNames = findServers(ns, (server) => server !== 'home');

  /** @type {Server[]} **/
  const servers = serverNames
    .map((serverName) => ns.getServer(serverName))
    .filter((server) => {
      if (!server.hasAdminRights) return false;
      if (!server.moneyMax) return false;
      if (ns.getHackingLevel() < server.requiredHackingSkill) return false;
      if (difficultyTarget < server.minDifficulty) return false;
      if (growthTarget < server.serverGrowth) return false;
      return true;
    });

  servers.sort((a, b) => b.moneyMax - a.moneyMax);
  
  return servers;
};

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const [limit = 10, difficultyTarget, growthTarget] = ns.args;
  const servers = findIdealTargets(ns, difficultyTarget, growthTarget);

  ns.tprint(
    servers
      .slice(0, limit)
      .map((server) => {
        const props = [
          `  money: ${ns.nFormat(server.moneyAvailable, FORMAT_MONEY)} (max: ${ns.nFormat(
            server.moneyMax,
            FORMAT_MONEY
          )})`,
          `  growth: ${server.serverGrowth.toFixed(1)}`,
          `  security: ${server.hackDifficulty.toFixed(1)} (min: ${server.minDifficulty.toFixed(1)})`,
        ];

        return `\n${server.hostname}:\n${props.join('\n')}`;
      })
      .join('\n')
  );
}
