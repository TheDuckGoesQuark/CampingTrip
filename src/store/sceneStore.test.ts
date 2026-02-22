import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from './sceneStore';

describe('useSceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState({
      wakeUpDone: false,
      tentDoorState: 'open',
      lanternOn: true,
      laptopFocused: false,
      notepadFocused: false,
      currentScene: 'tent',
      focusTarget: 'default',
    });
  });

  it('initialises with correct defaults', () => {
    const state = useSceneStore.getState();
    expect(state.wakeUpDone).toBe(false);
    expect(state.tentDoorState).toBe('open');
    expect(state.lanternOn).toBe(true);
    expect(state.laptopFocused).toBe(false);
    expect(state.notepadFocused).toBe(false);
    expect(state.currentScene).toBe('tent');
    expect(state.focusTarget).toBe('default');
  });

  it('setWakeUpDone sets to true', () => {
    useSceneStore.getState().setWakeUpDone();
    expect(useSceneStore.getState().wakeUpDone).toBe(true);
  });

  it('setTentDoorState transitions through door states', () => {
    const states: Array<'closed' | 'opening' | 'open' | 'closing'> = [
      'closed', 'opening', 'open', 'closing',
    ];
    for (const s of states) {
      useSceneStore.getState().setTentDoorState(s);
      expect(useSceneStore.getState().tentDoorState).toBe(s);
    }
  });

  it('toggleLantern flips the lantern state', () => {
    expect(useSceneStore.getState().lanternOn).toBe(true);

    useSceneStore.getState().toggleLantern();
    expect(useSceneStore.getState().lanternOn).toBe(false);

    useSceneStore.getState().toggleLantern();
    expect(useSceneStore.getState().lanternOn).toBe(true);
  });

  it('setLaptopFocused toggles focus state', () => {
    useSceneStore.getState().setLaptopFocused(true);
    expect(useSceneStore.getState().laptopFocused).toBe(true);

    useSceneStore.getState().setLaptopFocused(false);
    expect(useSceneStore.getState().laptopFocused).toBe(false);
  });

  it('setNotepadFocused toggles focus state', () => {
    useSceneStore.getState().setNotepadFocused(true);
    expect(useSceneStore.getState().notepadFocused).toBe(true);

    useSceneStore.getState().setNotepadFocused(false);
    expect(useSceneStore.getState().notepadFocused).toBe(false);
  });

  it('setCurrentScene switches scenes', () => {
    useSceneStore.getState().setCurrentScene('forest');
    expect(useSceneStore.getState().currentScene).toBe('forest');

    useSceneStore.getState().setCurrentScene('tent');
    expect(useSceneStore.getState().currentScene).toBe('tent');
  });

  it('setFocusTarget changes camera preset target', () => {
    const targets: Array<'default' | 'lantern' | 'laptop' | 'door' | 'guitar' | 'notepad'> = [
      'default', 'lantern', 'laptop', 'door', 'guitar', 'notepad',
    ];
    for (const t of targets) {
      useSceneStore.getState().setFocusTarget(t);
      expect(useSceneStore.getState().focusTarget).toBe(t);
    }
  });
});
