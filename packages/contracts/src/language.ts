import { z } from 'zod';

export const CppStandardSchema = z.enum(['CPP17', 'CPP20', 'CPP23']);
export type CppStandard = z.infer<typeof CppStandardSchema>;

export const ToolchainProfileSchema = z.enum([
  'GNU_CPP17',
  'GNU_CPP20',
  'GNU_CPP23',
  'CLANG_CPP17',
  'CLANG_CPP20',
  'CLANG_CPP23',
]);
export type ToolchainProfile = z.infer<typeof ToolchainProfileSchema>;

export const ToolchainCompilerSchema = z.enum(['g++-13', 'clang++-17']);
export type ToolchainCompiler = z.infer<typeof ToolchainCompilerSchema>;

export interface TrustedToolchainConfig {
  compiler: ToolchainCompiler;
  standard: CppStandard;
  flags: readonly string[];
}

/**
 * Authoritative trusted runner toolchain profiles.
 * Users and clients can select a toolchainProfile, but CANNOT supply arbitrary compiler/linker flags.
 * The runner uses these hardcoded configurations exclusively.
 */
export const TRUSTED_TOOLCHAIN_CONFIGS: Record<ToolchainProfile, TrustedToolchainConfig> =
  {
    GNU_CPP17: {
      compiler: 'g++-13',
      standard: 'CPP17',
      flags: [
        '-std=c++17',
        '-O2',
        '-pipe',
        '-Wall',
        '-Wextra',
        '-Wconversion',
        '-Wshadow',
      ],
    },
    GNU_CPP20: {
      compiler: 'g++-13',
      standard: 'CPP20',
      flags: [
        '-std=c++20',
        '-O2',
        '-pipe',
        '-Wall',
        '-Wextra',
        '-Wconversion',
        '-Wshadow',
      ],
    },
    GNU_CPP23: {
      compiler: 'g++-13',
      standard: 'CPP23',
      flags: [
        '-std=c++23',
        '-O2',
        '-pipe',
        '-Wall',
        '-Wextra',
        '-Wconversion',
        '-Wshadow',
      ],
    },
    CLANG_CPP17: {
      compiler: 'clang++-17',
      standard: 'CPP17',
      flags: [
        '-std=c++17',
        '-O2',
        '-pipe',
        '-Wall',
        '-Wextra',
        '-Wconversion',
        '-Wshadow',
      ],
    },
    CLANG_CPP20: {
      compiler: 'clang++-17',
      standard: 'CPP20',
      flags: [
        '-std=c++20',
        '-O2',
        '-pipe',
        '-Wall',
        '-Wextra',
        '-Wconversion',
        '-Wshadow',
      ],
    },
    CLANG_CPP23: {
      compiler: 'clang++-17',
      standard: 'CPP23',
      flags: [
        '-std=c++23',
        '-O2',
        '-pipe',
        '-Wall',
        '-Wextra',
        '-Wconversion',
        '-Wshadow',
      ],
    },
  };
