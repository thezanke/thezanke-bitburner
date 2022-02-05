/**
 * @param {NS} ns
 * @param {string} hostname
 * */
export const getPreviousScriptTarget = (ns, hostname) => {
  const details = ns.getRunningScript(1, hostname);
  return details?.args[0];
};
