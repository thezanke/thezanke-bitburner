/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const [target, start = 'home'] = ns.args;

  if (!target) throw Error('target required');

  const visited = [];

  const scan = (current = start, path = []) => {
    if (current === target) {
      ns.tprint(path.map((s) => `connect ${s}`).join(';'));

      return true;
    }

    visited.push(current);

    return ns.scan(current).some((n) => !visited.includes(n) && scan(n, [...path, n]));
  };

  return scan();
}

export const autocomplete = (data) => data.servers;
