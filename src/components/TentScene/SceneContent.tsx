import CameraController from './CameraController';
import WakeUpController from './WakeUpController';
import Lighting from './Lighting';
import TentInterior from './environment/TentInterior';
import OutdoorScene from './environment/OutdoorScene';
import RainSystem from './environment/RainSystem';
import Lantern from './objects/Lantern/Lantern';
import Cat from './objects/Cat/Cat';
import Laptop from './objects/Laptop/Laptop';
import Guitar from './objects/Guitar/Guitar';

export default function SceneContent() {
  return (
    <>
      <CameraController />
      <WakeUpController />
      <Lighting />
      <TentInterior />
      <OutdoorScene />
      <RainSystem />
      <Lantern />
      <Cat />
      <Laptop />
      <Guitar />
    </>
  );
}
