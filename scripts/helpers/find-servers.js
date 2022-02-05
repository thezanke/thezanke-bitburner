/**
 * @param {NS} ns
 **/
export const findServers = (ns, filterFunction, current = 'home', list = [current], isRootNode = true) => {
  const found = ns.scan(current).filter((connection) => {
    if (list.includes(connection)) return false;
    return true;
  });

  list.push(...found);

  for (const connection of found) {
    findServers(ns, filterFunction, connection, list, false);
  }

  if (isRootNode) {
    return filterFunction ? list.filter((s, i) => filterFunction(s, i, ns)) : list;
  }
};
