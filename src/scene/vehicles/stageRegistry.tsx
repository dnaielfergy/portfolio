import { FictivStage } from "./FictivStage";
import { ParsonsStage } from "./ParsonsStage";
import { RunnerStage } from "./RunnerStage";
import { WhaleStage } from "./WhaleStage";
import { WiskStage } from "./WiskStage";
import { WreckStage } from "./WreckStage";

const STAGE_COMPONENTS: Record<string, () => React.JSX.Element | null> = {
  runner: RunnerStage,
  wreck: WreckStage,
  parsons_truck: ParsonsStage,
  whale: WhaleStage,
  wisk_evtol: WiskStage,
  fictiv_mech: FictivStage,
};

export function VehicleStageMesh({ stage }: { stage: string }): React.JSX.Element | null {
  const StageComponent = STAGE_COMPONENTS[stage];
  if (!StageComponent) {
    return null;
  }

  return <StageComponent />;
}
