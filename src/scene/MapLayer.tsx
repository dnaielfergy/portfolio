import { useMemo } from "react";
import { useTexture } from "@react-three/drei";

import { useWorldStoreContext } from "../state/worldStore";

const BASE_MAP_HEIGHT = 120;

export function MapLayer(): React.JSX.Element {
  const {
    world: { config },
  } = useWorldStoreContext();

  const texture = useTexture(config.assets.mapImage);

  const dimensions = useMemo(() => {
    const image = texture.image as { width?: number; height?: number } | undefined;
    if (!image?.width || !image.height) {
      return {
        width: 170,
        height: BASE_MAP_HEIGHT,
      };
    }

    const aspect = image.width / image.height;
    return {
      width: BASE_MAP_HEIGHT * aspect,
      height: BASE_MAP_HEIGHT,
    };
  }, [texture.image]);

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <planeGeometry args={[dimensions.width, dimensions.height]} />
        <meshStandardMaterial map={texture} roughness={1} metalness={0} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <planeGeometry args={[dimensions.width + 6, dimensions.height + 6]} />
        <meshStandardMaterial color="#2c353f" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
