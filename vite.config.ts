import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "FlowEngine",
      fileName: format => `flow-engine.${format}.js`,
      formats: ["es", "cjs", "umd"],
    },
    sourcemap: true,
    outDir: "dist",
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ["uuid", "events", "jsonpath", "lodash", "ajv"],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供全局变量
        globals: {
          uuid: "uuid",
          events: "events",
          jsonpath: "JSONPath",
          lodash: "_",
          ajv: "Ajv",
        },
      },
    },
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist/types",
    }),
  ],
  test: {
    include: ["**/__tests__/**/*.ts", "**/*.{test,spec}.ts"],
    environment: "node",
    globals: true,
  },
});
