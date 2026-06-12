import { useCallback } from 'react';
import {
  getStraightPath,
  useStore,
  type EdgeProps,
  type ReactFlowState,
} from '@xyflow/react';

export default function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
}: EdgeProps) {
  const sourceNode = useStore(
    useCallback((store: ReactFlowState) => store.nodeLookup.get(source), [source]),
  );
  const targetNode = useStore(
    useCallback((store: ReactFlowState) => store.nodeLookup.get(target), [target]),
  );

  if (!sourceNode || !targetNode) return null;

  const sx = (sourceNode.position?.x ?? 0) + ((sourceNode.measured?.width ?? 180) / 2);
  const sy = (sourceNode.position?.y ?? 0) + ((sourceNode.measured?.height ?? 80) / 2);
  const tx = (targetNode.position?.x ?? 0) + ((targetNode.measured?.width ?? 160) / 2);
  const ty = (targetNode.position?.y ?? 0) + ((targetNode.measured?.height ?? 80) / 2);

  const [edgePath] = getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty });

  return (
    <path
      id={id}
      d={edgePath}
      markerEnd={markerEnd}
      style={style}
      className="react-flow__edge-path"
      fill="none"
      strokeWidth={2.5}
    />
  );
}
