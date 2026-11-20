"use client";
import { useEffect, useRef } from "react";

// A slow field of soft colour, drawn by the graphics card. It leans toward the pointer and shifts as the page scrolls.
const FRAG = `
precision mediump float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform float dark;
void main() {
  vec2 uv = gl_FragCoord.xy / r;
  vec2 p = (uv - 0.5) * vec2(r.x / r.y, 1.0) * 2.2 + 0.3 * (m - 0.5);
  for (float i = 1.0; i < 5.0; i++) {
    p.x += 0.45 / i * sin(i * 2.1 * p.y + t * 0.35 + i * 1.7);
    p.y += 0.45 / i * cos(i * 1.7 * p.x + t * 0.28 + i * 2.3);
  }
  float a = 0.5 + 0.5 * sin(p.x * 1.3 + t * 0.2);
  float b = 0.5 + 0.5 * cos(p.y * 1.1 - t * 0.17);
  vec3 base = mix(vec3(0.984, 0.984, 0.98), vec3(0.043), dark);
  vec3 c1 = mix(vec3(0.66, 0.94, 0.78), vec3(0.02, 0.30, 0.17), dark);
  vec3 c2 = mix(vec3(0.90, 0.97, 0.62), vec3(0.20, 0.32, 0.04), dark);
  vec3 c3 = mix(vec3(0.76, 0.88, 1.0), vec3(0.03, 0.12, 0.25), dark);
  vec3 col = mix(base, c1, a * 0.8);
  col = mix(col, c2, b * 0.65 * a);
  col = mix(col, c3, (1.0 - a) * b * 0.6);
  float edge = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.75, uv.y); // melt into the page above and below
  gl_FragColor = vec4(mix(base, col, edge), 1.0);
}`;

export function Shader({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;
    const make = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, make(gl.VERTEX_SHADER, "attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }"));
    gl.attachShader(prog, make(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.bindAttribLocation(prog, 0, "a");
    gl.vertexAttribPointer(gl.getAttribLocation(prog, "a"), 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = [0.5, 0.5];
    const eased = [0.5, 0.5];
    const move = (e: PointerEvent) => {
      mouse[0] = e.clientX / innerWidth;
      mouse[1] = 1 - e.clientY / innerHeight;
    };
    addEventListener("pointermove", move, { passive: true });
    let id = 0;
    let visible = true;
    const draw = (ms: number) => {
      // Soft shapes need few pixels: draw at a third of the size and let the browser smooth it.
      const w = Math.max(2, Math.round(canvas.clientWidth / 3));
      const h = Math.max(2, Math.round(canvas.clientHeight / 3));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      eased[0] += (mouse[0] - eased[0]) * 0.04;
      eased[1] += (mouse[1] - eased[1]) * 0.04;
      gl.uniform2f(u("r"), w, h);
      gl.uniform1f(u("t"), ms / 1000 + scrollY / 400);
      gl.uniform2f(u("m"), eased[0], eased[1]);
      gl.uniform1f(u("dark"), document.documentElement.classList.contains("dark") ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!still && visible) id = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(id);
      if (visible) id = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(id);
      removeEventListener("pointermove", move);
    };
  }, []);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
