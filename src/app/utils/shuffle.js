
// export function shuffle(array) {
//   let currentIndex = array.length, temporaryValue, randomIndex;
//
//   while (0 !== currentIndex) {
//     randomIndex = Math.floor(Math.random() * currentIndex);
//     currentIndex -= 1;
//     temporaryValue = array[currentIndex];
//     array[currentIndex] = array[randomIndex];
//     array[randomIndex] = temporaryValue;
//   }
//
//   return array;
// }

/**
 * An implementation of Fisher-Yates (aka Knuth) Shuffle
 * @param array
 * @return {array} - a shuffled shallow copy of the array
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}