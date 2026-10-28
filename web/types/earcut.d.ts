// earcut 3 ships no types: the one function the map uses (components/map/gl/scene.ts)
declare module "earcut" {
  export default function earcut(data: ArrayLike<number>, holeIndices?: ArrayLike<number> | null, dim?: number): number[];
}
