import { Results as FaceMeshResults } from "@mediapipe/face_mesh";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  uniform sampler2D u_faceMask;
  uniform sampler2D u_lipMask;
  uniform sampler2D u_blushMask;
  uniform sampler2D u_eyeMask;
  
  uniform float u_smoothing;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_warmth;
  
  uniform vec3 u_lipColor;
  uniform float u_lipIntensity;
  uniform float u_lipGloss;
  
  uniform vec3 u_blushColor;
  uniform float u_blushIntensity;
  
  uniform vec3 u_eyeShadowColor;
  uniform float u_eyeShadowIntensity;
  
  uniform vec2 u_resolution;
  
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
  
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  float softLight(float base, float blend) {
    if (blend < 0.5) {
      return base - (1.0 - 2.0 * blend) * base * (1.0 - base);
    } else {
      float d = (base <= 0.25) ? ((16.0 * base - 12.0) * base + 4.0) * base : sqrt(base);
      return base + (2.0 * blend - 1.0) * (d - base);
    }
  }
  
  vec3 softLightBlend(vec3 base, vec3 blend) {
    return vec3(
      softLight(base.r, blend.r),
      softLight(base.g, blend.g),
      softLight(base.b, blend.b)
    );
  }
  
  vec3 overlayBlend(vec3 base, vec3 blend) {
    vec3 result;
    result.r = base.r < 0.5 ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r));
    result.g = base.g < 0.5 ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g));
    result.b = base.b < 0.5 ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b));
    return result;
  }
  
  vec3 multiplyBlend(vec3 base, vec3 blend) {
    return base * blend;
  }
  
  vec3 adjustSaturation(vec3 color, float saturation) {
    vec3 hsv = rgb2hsv(color);
    hsv.y *= saturation;
    return hsv2rgb(hsv);
  }
  
  vec3 adjustBrightness(vec3 color, float brightness) {
    return color * brightness;
  }
  
  vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
  }
  
  vec3 adjustWarmth(vec3 color, float warmth) {
    color.r += warmth * 0.08;
    color.b -= warmth * 0.04;
    return clamp(color, 0.0, 1.0);
  }
  
  vec3 bilateralBlur(sampler2D tex, vec2 uv, float sigma, float faceMaskValue) {
    // Skip blur if face mask is too low or sigma is minimal
    if (faceMaskValue < 0.1 || sigma < 0.15) return texture2D(tex, uv).rgb;
    
    vec3 center = texture2D(tex, uv).rgb;
    vec3 sum = center;
    float weightSum = 1.0;
    
    float sigmaTone = 0.1;
    
    // Optimized 5-tap cross pattern instead of 7x7 (49 taps)
    vec2 offsets[4];
    offsets[0] = vec2(-1.5, 0.0) / u_resolution;
    offsets[1] = vec2(1.5, 0.0) / u_resolution;
    offsets[2] = vec2(0.0, -1.5) / u_resolution;
    offsets[3] = vec2(0.0, 1.5) / u_resolution;
    
    for (int i = 0; i < 4; i++) {
      vec3 sampleColor = texture2D(tex, uv + offsets[i]).rgb;
      float toneDiff = dot(sampleColor - center, sampleColor - center);
      float weight = exp(-toneDiff / (2.0 * sigmaTone * sigmaTone)) * 0.8;
      sum += sampleColor * weight;
      weightSum += weight;
    }
    
    vec3 blurred = sum / weightSum;
    float blendFactor = faceMaskValue * sigma * 0.7;
    return mix(center, blurred, clamp(blendFactor, 0.0, 0.5));
  }
  
  void main() {
    vec2 uv = v_texCoord;
    vec4 originalColor = texture2D(u_image, uv);
    vec3 color = originalColor.rgb;
    
    float faceMask = texture2D(u_faceMask, uv).r;
    float lipMask = texture2D(u_lipMask, uv).r;
    float blushMask = texture2D(u_blushMask, uv).r;
    float eyeMask = texture2D(u_eyeMask, uv).r;
    
    float skinMask = faceMask * (1.0 - lipMask * 0.9) * (1.0 - eyeMask * 0.95);
    
    if (u_smoothing > 0.0) {
      color = bilateralBlur(u_image, uv, u_smoothing, skinMask);
    }
    
    color = adjustBrightness(color, u_brightness);
    color = adjustContrast(color, u_contrast);
    color = adjustSaturation(color, u_saturation);
    color = adjustWarmth(color, u_warmth);
    
    if (u_blushIntensity > 0.0 && blushMask > 0.02) {
      float smoothBlush = smoothstep(0.0, 0.5, blushMask);
      vec3 tintedBlush = softLightBlend(color, u_blushColor);
      float blushAlpha = smoothBlush * u_blushIntensity * 0.35;
      color = mix(color, tintedBlush, blushAlpha);
    }
    
    if (u_lipIntensity > 0.0 && lipMask > 0.05) {
      float smoothLip = smoothstep(0.0, 0.4, lipMask);
      
      float luminance = dot(color, vec3(0.299, 0.587, 0.114));
      vec3 lipTint = mix(color * u_lipColor * 1.2, u_lipColor, 0.5);
      lipTint = mix(lipTint, lipTint * luminance * 1.5, 0.3);
      
      float lipAlpha = smoothLip * u_lipIntensity * 0.55;
      color = mix(color, lipTint, lipAlpha);
      
      if (u_lipGloss > 0.0) {
        float centerY = 0.5;
        float highlightPos = 1.0 - abs(uv.y - centerY) * 4.0;
        float glossHighlight = pow(max(0.0, highlightPos), 3.0) * smoothLip;
        color += vec3(glossHighlight * u_lipGloss * 0.15);
      }
    }
    
    if (u_eyeShadowIntensity > 0.0 && eyeMask > 0.05) {
      float smoothEye = smoothstep(0.0, 0.5, eyeMask);
      vec3 shadowTint = overlayBlend(color, u_eyeShadowColor);
      float shadowAlpha = smoothEye * u_eyeShadowIntensity * 0.3;
      color = mix(color, shadowTint, shadowAlpha);
    }
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), originalColor.a);
  }
`;

export interface BeautyFilterSettings {
  smoothing: number;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  lipColor: [number, number, number];
  lipIntensity: number;
  lipGloss: number;
  blushColor: [number, number, number];
  blushIntensity: number;
  eyeShadowColor: [number, number, number];
  eyeShadowIntensity: number;
}

export const defaultSettings: BeautyFilterSettings = {
  smoothing: 0,
  brightness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  warmth: 0,
  lipColor: [0.9, 0.4, 0.45],
  lipIntensity: 0,
  lipGloss: 0,
  blushColor: [1.0, 0.75, 0.75],
  blushIntensity: 0,
  eyeShadowColor: [0.6, 0.5, 0.8],
  eyeShadowIntensity: 0,
};

const LIP_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const LIP_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];

const LEFT_CHEEK_CENTER = [116, 117, 118, 119, 120, 121, 50, 101];
const RIGHT_CHEEK_CENTER = [345, 346, 347, 348, 349, 350, 280, 330];

const LEFT_EYE_UPPER = [226, 247, 30, 29, 27, 28, 56, 190];
const RIGHT_EYE_UPPER = [446, 467, 260, 259, 257, 258, 286, 414];

const FACE_OUTLINE = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
];

interface SmoothedLandmark {
  x: number;
  y: number;
  z: number;
}

export class WebGLBeautyFilter {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private canvas: HTMLCanvasElement;
  private videoTexture: WebGLTexture | null = null;
  private faceMaskTexture: WebGLTexture | null = null;
  private lipMaskTexture: WebGLTexture | null = null;
  private blushMaskTexture: WebGLTexture | null = null;
  private eyeMaskTexture: WebGLTexture | null = null;
  
  private faceMaskCanvas: HTMLCanvasElement;
  private faceMaskCtx: CanvasRenderingContext2D;
  private lipMaskCanvas: HTMLCanvasElement;
  private lipMaskCtx: CanvasRenderingContext2D;
  private blushMaskCanvas: HTMLCanvasElement;
  private blushMaskCtx: CanvasRenderingContext2D;
  private eyeMaskCanvas: HTMLCanvasElement;
  private eyeMaskCtx: CanvasRenderingContext2D;
  
  private settings: BeautyFilterSettings = { ...defaultSettings };
  private initialized = false;
  
  private prevLandmarks: SmoothedLandmark[] | null = null;
  private smoothingFactor = 0.65;
  
  constructor() {
    this.canvas = document.createElement("canvas");
    
    this.faceMaskCanvas = document.createElement("canvas");
    this.faceMaskCtx = this.faceMaskCanvas.getContext("2d", { willReadFrequently: true })!;
    this.lipMaskCanvas = document.createElement("canvas");
    this.lipMaskCtx = this.lipMaskCanvas.getContext("2d", { willReadFrequently: true })!;
    this.blushMaskCanvas = document.createElement("canvas");
    this.blushMaskCtx = this.blushMaskCanvas.getContext("2d", { willReadFrequently: true })!;
    this.eyeMaskCanvas = document.createElement("canvas");
    this.eyeMaskCtx = this.eyeMaskCanvas.getContext("2d", { willReadFrequently: true })!;
  }
  
  initialize(width: number, height: number): boolean {
    this.canvas.width = width;
    this.canvas.height = height;
    
    [this.faceMaskCanvas, this.lipMaskCanvas, this.blushMaskCanvas, this.eyeMaskCanvas].forEach(c => {
      c.width = width;
      c.height = height;
    });
    
    const gl = this.canvas.getContext("webgl", {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: true,
    });
    
    if (!gl) {
      console.warn("WebGL not supported, falling back to canvas");
      return false;
    }
    
    this.gl = gl;
    
    const vertexShader = this.createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return false;
    
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(this.program));
      return false;
    }
    
    this.setupBuffers();
    this.setupTextures();
    
    this.initialized = true;
    return true;
  }
  
  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl!;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  private setupBuffers() {
    const gl = this.gl!;
    
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1,
    ]);
    
    const texCoords = new Float32Array([
      0, 1,  1, 1,  0, 0,
      0, 0,  1, 1,  1, 0,
    ]);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLoc = gl.getAttribLocation(this.program!, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    
    const texCoordLoc = gl.getAttribLocation(this.program!, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
  }
  
  private setupTextures() {
    this.videoTexture = this.createTexture();
    this.faceMaskTexture = this.createTexture();
    this.lipMaskTexture = this.createTexture();
    this.blushMaskTexture = this.createTexture();
    this.eyeMaskTexture = this.createTexture();
  }
  
  private createTexture(): WebGLTexture {
    const gl = this.gl!;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }
  
  updateSettings(settings: Partial<BeautyFilterSettings>) {
    this.settings = { ...this.settings, ...settings };
  }
  
  private smoothLandmarks(landmarks: any[]): SmoothedLandmark[] {
    const currentLandmarks: SmoothedLandmark[] = landmarks.map(lm => ({
      x: lm.x,
      y: lm.y,
      z: lm.z || 0
    }));
    
    if (!this.prevLandmarks || this.prevLandmarks.length !== currentLandmarks.length) {
      this.prevLandmarks = currentLandmarks;
      return currentLandmarks;
    }
    
    const smoothed: SmoothedLandmark[] = [];
    
    for (let i = 0; i < currentLandmarks.length; i++) {
      const prev = this.prevLandmarks[i];
      const curr = currentLandmarks[i];
      
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const motion = Math.sqrt(dx * dx + dy * dy);
      
      let adaptiveAlpha: number;
      if (motion > 0.03) {
        adaptiveAlpha = 0.35;
      } else if (motion > 0.01) {
        adaptiveAlpha = 0.55;
      } else {
        adaptiveAlpha = 0.75;
      }
      
      adaptiveAlpha = Math.max(0.35, Math.min(0.85, adaptiveAlpha));
      
      smoothed.push({
        x: prev.x * adaptiveAlpha + curr.x * (1 - adaptiveAlpha),
        y: prev.y * adaptiveAlpha + curr.y * (1 - adaptiveAlpha),
        z: prev.z * adaptiveAlpha + curr.z * (1 - adaptiveAlpha),
      });
    }
    
    this.prevLandmarks = smoothed;
    return smoothed;
  }
  
  updateFaceMesh(results: FaceMeshResults | null) {
    if (!results?.multiFaceLandmarks?.[0]) {
      this.clearMasks();
      this.prevLandmarks = null;
      return;
    }
    
    const rawLandmarks = results.multiFaceLandmarks[0];
    const landmarks = this.smoothLandmarks(rawLandmarks);
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    this.drawFaceMask(landmarks, width, height);
    this.drawLipMask(landmarks, width, height);
    this.drawBlushMask(landmarks, width, height);
    this.drawEyeMask(landmarks, width, height);
  }
  
  private clearMasks() {
    [this.faceMaskCtx, this.lipMaskCtx, this.blushMaskCtx, this.eyeMaskCtx].forEach(ctx => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });
  }
  
  private drawFaceMask(landmarks: SmoothedLandmark[], width: number, height: number) {
    const ctx = this.faceMaskCtx;
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = "white";
    ctx.beginPath();
    
    FACE_OUTLINE.forEach((idx, i) => {
      const point = landmarks[idx];
      const x = point.x * width;
      const y = point.y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.closePath();
    ctx.fill();
    
    ctx.filter = "blur(20px)";
    ctx.drawImage(this.faceMaskCanvas, 0, 0);
    ctx.filter = "none";
  }
  
  private drawLipMask(landmarks: SmoothedLandmark[], width: number, height: number) {
    const ctx = this.lipMaskCtx;
    ctx.clearRect(0, 0, width, height);
    
    let centerX = 0, centerY = 0;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    LIP_OUTER.forEach(idx => {
      const point = landmarks[idx];
      const x = point.x * width;
      const y = point.y * height;
      centerX += x;
      centerY += y;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    
    centerX /= LIP_OUTER.length;
    centerY /= LIP_OUTER.length;
    
    const lipWidth = maxX - minX;
    const lipHeight = maxY - minY;
    
    ctx.save();
    
    ctx.beginPath();
    LIP_OUTER.forEach((idx, i) => {
      const point = landmarks[idx];
      const x = point.x * width;
      const y = point.y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    
    LIP_INNER.forEach((idx, i) => {
      const point = landmarks[idx];
      const x = point.x * width;
      const y = point.y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    
    ctx.clip("evenodd");
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(lipWidth, lipHeight) * 0.7
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
    gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.7)");
    gradient.addColorStop(1.0, "rgba(255, 255, 255, 0.2)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(minX - 10, minY - 10, lipWidth + 20, lipHeight + 20);
    
    ctx.restore();
    
    ctx.filter = "blur(3px)";
    ctx.drawImage(this.lipMaskCanvas, 0, 0);
    ctx.filter = "none";
  }
  
  private drawBlushMask(landmarks: SmoothedLandmark[], width: number, height: number) {
    const ctx = this.blushMaskCtx;
    ctx.clearRect(0, 0, width, height);
    
    const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x) * width;
    const baseRadius = faceWidth * 0.12;
    
    const drawCheek = (indices: number[], offsetX: number, offsetY: number) => {
      let centerX = 0, centerY = 0;
      indices.forEach(idx => {
        centerX += landmarks[idx].x;
        centerY += landmarks[idx].y;
      });
      centerX = (centerX / indices.length) * width + offsetX;
      centerY = (centerY / indices.length) * height + offsetY;
      
      const radiusX = baseRadius * 1.3;
      const radiusY = baseRadius * 0.9;
      
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(radiusX, radiusY)
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
      gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.5)");
      gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.25)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(radiusX / radiusY, 1);
      ctx.translate(-centerX, -centerY);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radiusY, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };
    
    drawCheek(LEFT_CHEEK_CENTER, -width * 0.01, height * 0.02);
    drawCheek(RIGHT_CHEEK_CENTER, width * 0.01, height * 0.02);
  }
  
  private drawEyeMask(landmarks: SmoothedLandmark[], width: number, height: number) {
    const ctx = this.eyeMaskCtx;
    ctx.clearRect(0, 0, width, height);
    
    const drawEyeShadow = (indices: number[], isLeft: boolean) => {
      let centerX = 0, centerY = 0;
      let minY = Infinity, maxY = -Infinity;
      let minX = Infinity, maxX = -Infinity;
      
      indices.forEach(idx => {
        const point = landmarks[idx];
        const x = point.x * width;
        const y = point.y * height;
        centerX += x;
        centerY += y;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
      
      centerX /= indices.length;
      centerY /= indices.length;
      
      const eyeWidth = maxX - minX;
      const eyeHeight = maxY - minY;
      
      centerY -= eyeHeight * 0.3;
      
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, eyeWidth * 0.6
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, eyeWidth * 0.5, eyeHeight * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    
    drawEyeShadow(LEFT_EYE_UPPER, true);
    drawEyeShadow(RIGHT_EYE_UPPER, false);
    
    ctx.filter = "blur(10px)";
    ctx.drawImage(this.eyeMaskCanvas, 0, 0);
    ctx.filter = "none";
  }
  
  render(source: HTMLVideoElement | HTMLCanvasElement): HTMLCanvasElement {
    if (!this.initialized || !this.gl || !this.program) {
      return this.fallbackRender(source);
    }
    
    const gl = this.gl;
    
    gl.useProgram(this.program);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_image"), 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.faceMaskTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.faceMaskCanvas);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_faceMask"), 1);
    
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.lipMaskTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.lipMaskCanvas);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_lipMask"), 2);
    
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.blushMaskTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.blushMaskCanvas);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_blushMask"), 3);
    
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.eyeMaskTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.eyeMaskCanvas);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_eyeMask"), 4);
    
    gl.uniform1f(gl.getUniformLocation(this.program, "u_smoothing"), this.settings.smoothing);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_brightness"), this.settings.brightness);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_contrast"), this.settings.contrast);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_saturation"), this.settings.saturation);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_warmth"), this.settings.warmth);
    
    gl.uniform3f(gl.getUniformLocation(this.program, "u_lipColor"), ...this.settings.lipColor);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_lipIntensity"), this.settings.lipIntensity);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_lipGloss"), this.settings.lipGloss);
    
    gl.uniform3f(gl.getUniformLocation(this.program, "u_blushColor"), ...this.settings.blushColor);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_blushIntensity"), this.settings.blushIntensity);
    
    gl.uniform3f(gl.getUniformLocation(this.program, "u_eyeShadowColor"), ...this.settings.eyeShadowColor);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_eyeShadowIntensity"), this.settings.eyeShadowIntensity);
    
    gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), this.canvas.width, this.canvas.height);
    
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    return this.canvas;
  }
  
  private fallbackRender(source: HTMLVideoElement | HTMLCanvasElement): HTMLCanvasElement {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return this.canvas;
    
    ctx.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);
    
    if (this.settings.smoothing > 0) {
      ctx.filter = `blur(${this.settings.smoothing * 1.5}px)`;
      ctx.globalAlpha = this.settings.smoothing * 0.4;
      ctx.drawImage(this.canvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.filter = "none";
    }
    
    const filters: string[] = [];
    if (this.settings.brightness !== 1) filters.push(`brightness(${this.settings.brightness})`);
    if (this.settings.contrast !== 1) filters.push(`contrast(${this.settings.contrast})`);
    if (this.settings.saturation !== 1) filters.push(`saturate(${this.settings.saturation})`);
    if (this.settings.warmth > 0) filters.push(`sepia(${this.settings.warmth * 0.15})`);
    
    if (filters.length > 0) {
      ctx.filter = filters.join(" ");
      ctx.drawImage(this.canvas, 0, 0);
      ctx.filter = "none";
    }
    
    return this.canvas;
  }
  
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  destroy() {
    if (this.gl) {
      this.gl.deleteProgram(this.program);
      this.gl.deleteTexture(this.videoTexture);
      this.gl.deleteTexture(this.faceMaskTexture);
      this.gl.deleteTexture(this.lipMaskTexture);
      this.gl.deleteTexture(this.blushMaskTexture);
      this.gl.deleteTexture(this.eyeMaskTexture);
    }
    this.initialized = false;
    this.prevLandmarks = null;
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  }
  return [1, 1, 1];
}

export function createFilterSettings(filter: {
  smooth?: number;
  brighten?: number;
  lipTint?: { intensity: number; color: string };
  lipGloss?: { intensity: number; color: string };
  blush?: { intensity: number; color: string };
  eyeShadow?: { intensity: number; color: string };
  colorFilter?: { filter?: string };
}): Partial<BeautyFilterSettings> {
  const settings: Partial<BeautyFilterSettings> = {};
  
  if (filter.smooth !== undefined) {
    settings.smoothing = filter.smooth / 100;
  }
  
  if (filter.brighten !== undefined) {
    settings.brightness = 1 + (filter.brighten / 100) * 0.25;
  }
  
  if (filter.lipTint) {
    settings.lipColor = hexToRgb(filter.lipTint.color);
    settings.lipIntensity = filter.lipTint.intensity / 100;
  }
  
  if (filter.lipGloss) {
    settings.lipGloss = filter.lipGloss.intensity / 100;
  }
  
  if (filter.blush) {
    settings.blushColor = hexToRgb(filter.blush.color);
    settings.blushIntensity = filter.blush.intensity / 100;
  }
  
  if (filter.eyeShadow) {
    settings.eyeShadowColor = hexToRgb(filter.eyeShadow.color);
    settings.eyeShadowIntensity = filter.eyeShadow.intensity / 100;
  }
  
  if (filter.colorFilter?.filter) {
    const filterStr = filter.colorFilter.filter;
    
    const satMatch = filterStr.match(/saturate\(([\d.]+)\)/);
    if (satMatch) settings.saturation = parseFloat(satMatch[1]);
    
    const brightMatch = filterStr.match(/brightness\(([\d.]+)\)/);
    if (brightMatch) settings.brightness = parseFloat(brightMatch[1]);
    
    const sepiaMatch = filterStr.match(/sepia\(([\d.]+)\)/);
    if (sepiaMatch) settings.warmth = parseFloat(sepiaMatch[1]) * 2;
  }
  
  return settings;
}
