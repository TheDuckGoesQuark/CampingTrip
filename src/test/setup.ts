import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// ─── Mock Web Audio API ──────────────────────────────────────────
class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
    cancelScheduledValues: vi.fn().mockReturnThis(),
  };
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

class MockOscillator {
  type = 'sine';
  frequency = {
    value: 440,
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
  };
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  addEventListener = vi.fn();
}

class MockBiquadFilter {
  type = 'lowpass';
  frequency = {
    value: 350,
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
  };
  Q = { value: 1 };
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

class MockStereoPanner {
  pan = { value: 0 };
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

class MockAudioBufferSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  playbackRate = { value: 1 };
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  addEventListener = vi.fn();
}

class MockAudioContext {
  state = 'running' as AudioContextState;
  currentTime = 0;
  destination = { maxChannelCount: 2 };
  sampleRate = 44100;

  createGain = vi.fn(() => new MockGainNode());
  createOscillator = vi.fn(() => new MockOscillator());
  createBiquadFilter = vi.fn(() => new MockBiquadFilter());
  createBufferSource = vi.fn(() => new MockAudioBufferSource());
  createStereoPanner = vi.fn(() => new MockStereoPanner());

  createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => ({
    duration: length / sampleRate,
    numberOfChannels: channels,
    sampleRate,
    length,
    getChannelData: vi.fn(() => new Float32Array(length)),
  }));

  decodeAudioData = vi.fn().mockResolvedValue({
    duration: 10,
    numberOfChannels: 2,
    sampleRate: 44100,
    length: 441000,
    getChannelData: vi.fn(() => new Float32Array(441000)),
  });

  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;

// ─── Mock WebGL context ──────────────────────────────────────────
const mockWebGLContext = {
  getExtension: vi.fn(() => ({})),
  getParameter: vi.fn((param: number) => {
    const defaults: Record<number, unknown> = {
      0x1f02: 'Mock WebGL',
      0x8b4c: 16,
      0x0d33: 4096,
      0x851c: 16,
    };
    return defaults[param] ?? 0;
  }),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  createTexture: vi.fn(() => ({})),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  createFramebuffer: vi.fn(() => ({})),
  bindFramebuffer: vi.fn(),
  framebufferTexture2D: vi.fn(),
  createRenderbuffer: vi.fn(() => ({})),
  bindRenderbuffer: vi.fn(),
  renderbufferStorage: vi.fn(),
  framebufferRenderbuffer: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  blendFunc: vi.fn(),
  depthFunc: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  getShaderInfoLog: vi.fn(() => ''),
  getProgramInfoLog: vi.fn(() => ''),
  getActiveAttrib: vi.fn(() => ({ name: '', size: 1, type: 0 })),
  getActiveUniform: vi.fn(() => ({ name: '', size: 1, type: 0 })),
  getAttribLocation: vi.fn(() => 0),
  getUniformLocation: vi.fn(() => ({})),
  uniform1f: vi.fn(),
  uniform1i: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  uniform4f: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  pixelStorei: vi.fn(),
  activeTexture: vi.fn(),
  scissor: vi.fn(),
  colorMask: vi.fn(),
  depthMask: vi.fn(),
  stencilFunc: vi.fn(),
  stencilOp: vi.fn(),
  stencilMask: vi.fn(),
  generateMipmap: vi.fn(),
  isContextLost: vi.fn(() => false),
  deleteBuffer: vi.fn(),
  deleteTexture: vi.fn(),
  deleteShader: vi.fn(),
  deleteProgram: vi.fn(),
  deleteFramebuffer: vi.fn(),
  deleteRenderbuffer: vi.fn(),
  checkFramebufferStatus: vi.fn(() => 0x8cd5),
  canvas: { width: 800, height: 600 },
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
};

const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = vi.fn(function (
  this: HTMLCanvasElement,
  contextType: string,
  ...args: unknown[]
) {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext as unknown as RenderingContext;
  }
  return originalGetContext.call(this, contextType, ...args);
}) as typeof HTMLCanvasElement.prototype.getContext;

// ─── Mock matchMedia ─────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── Mock ResizeObserver ─────────────────────────────────────────
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ─── Mock HTMLMediaElement ───────────────────────────────────────
HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.load = vi.fn();

// ─── Reset stores between tests ─────────────────────────────────
afterEach(() => {
  vi.restoreAllMocks();
});
