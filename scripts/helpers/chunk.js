export const chunk = (arr, size) => {
  let out = [];
  const chunkCount = Math.ceil(arr.length / size);

  for (let i = 0; i < chunkCount; i += 1) {
    const start = i * size;
    out.push(arr.slice(start, start + size));
  }

  return out;
};
