/**
 * Manifest Validator Tests
 * Tests manifest parsing and validation (Requirements 5.2, 5.5, 8.1)
 */

import { describe, it, expect } from 'vitest'
import { ManifestValidator } from '../loader/manifest-validator'
import { PluginManifest } from '../../types/plugin'

describe('ManifestValidator', () => {
  const validator = new ManifestValidator()

  describe('Required Fields Validation (Requirement 5.2)', () => {
    it('should pass validation for a valid manifest with all required fields', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation when id is missing', () => {
      const manifest = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'id',
        message: "Required field 'id' is missing or empty",
        severity: 'error'
      })
    })

    it('should fail validation when name is missing', () => {
      const manifest = {
        id: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: "Required field 'name' is missing or empty",
        severity: 'error'
      })
    })

    it('should fail validation when version is missing', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'version',
        message: "Required field 'version' is missing or empty",
        severity: 'error'
      })
    })

    it('should fail validation when description is missing', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'description',
        message: "Required field 'description' is missing or empty",
        severity: 'error'
      })
    })

    it('should fail validation when author is missing', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'author',
        message: "Required field 'author' is missing or empty",
        severity: 'error'
      })
    })

    it('should fail validation when entry is missing', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'entry',
        message: "Required field 'entry' is missing or empty",
        severity: 'error'
      })
    })

    it('should fail validation when required field is empty string', () => {
      const manifest = {
        id: '',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'id',
        message: "Required field 'id' is missing or empty",
        severity: 'error'
      })
    })
  })

  describe('Version Format Validation (Requirement 5.5)', () => {
    it('should pass validation for valid semver version', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass validation for semver with pre-release', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0-alpha.1',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass validation for semver with build metadata', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0+20130313144700',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for invalid version format', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'version',
        message: "Version '1.0' is not a valid semver format (expected x.y.z)",
        severity: 'error'
      })
    })

    it('should fail validation for non-numeric version', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: 'v1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'version',
        message: "Version 'v1.0.0' is not a valid semver format (expected x.y.z)",
        severity: 'error'
      })
    })
  })

  describe('Dependencies Validation (Requirements 5.2, 5.5)', () => {
    it('should pass validation for valid plugin dependencies', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        dependencies: {
          plugins: [
            { id: 'base-plugin', version: '^1.0.0' },
            { id: 'optional-plugin', version: '~2.0.0', optional: true }
          ]
        }
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass validation for valid service dependencies', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        dependencies: {
          services: [
            { interface: 'IAuthService' },
            { interface: 'IHttpClient', optional: true }
          ]
        }
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation when plugin dependency missing id', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        dependencies: {
          plugins: [
            { version: '^1.0.0' }
          ]
        }
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'dependencies.plugins[0].id',
        message: "Plugin dependency must have a valid 'id' field",
        severity: 'error'
      })
    })

    it('should fail validation when service dependency missing interface', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        dependencies: {
          services: [
            { optional: true }
          ]
        }
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'dependencies.services[0].interface',
        message: "Service dependency must have a valid 'interface' field",
        severity: 'error'
      })
    })

    it('should warn for invalid semver range in plugin dependency', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        dependencies: {
          plugins: [
            { id: 'base-plugin', version: 'latest' }
          ]
        }
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings).toContainEqual({
        field: 'dependencies.plugins[0].version',
        message: "Version 'latest' may not be a valid semver range",
        severity: 'warning'
      })
    })

    it('should fail validation when dependencies is not an object', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        dependencies: 'invalid'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'dependencies',
        message: "Field 'dependencies' must be an object",
        severity: 'error'
      })
    })

    it('should fail validation when plugins is not an array', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        dependencies: {
          plugins: 'invalid'
        }
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'dependencies.plugins',
        message: "Field 'dependencies.plugins' must be an array",
        severity: 'error'
      })
    })
  })

  describe('Activation Events Validation', () => {
    it('should pass validation for valid activation events', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        activationEvents: ['onStartup', 'onEvent:custom']
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn for non-string activation events', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        activationEvents: ['onStartup', 123]
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContainEqual({
        field: 'activationEvents[1]',
        message: 'Activation event must be a string',
        severity: 'warning'
      })
    })

    it('should warn for empty activation events', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        activationEvents: ['onStartup', '']
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContainEqual({
        field: 'activationEvents[1]',
        message: 'Activation event cannot be empty',
        severity: 'warning'
      })
    })
  })

  describe('Contributes and Capabilities Validation (Requirement 8.1)', () => {
    it('should pass validation for valid contributes', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        contributes: {
          commands: [{ id: 'test.command', handler: 'handleCommand' }],
          views: [{ id: 'test.view', component: 'TestView' }]
        }
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass validation for valid capabilities', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        capabilities: {
          authentication: true,
          storage: ['local', 'session']
        }
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn for empty contributes', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        contributes: {}
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContainEqual({
        field: 'contributes',
        message: "Field 'contributes' is empty",
        severity: 'warning'
      })
    })

    it('should warn for empty capabilities', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        capabilities: {}
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContainEqual({
        field: 'capabilities',
        message: "Field 'capabilities' is empty",
        severity: 'warning'
      })
    })
  })

  describe('Manifest Normalization', () => {
    it('should normalize manifest with defaults', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const { manifest: normalized, result } = validator.validateAndNormalize(manifest)
      
      expect(result.valid).toBe(true)
      expect(normalized).not.toBeNull()
      expect(normalized!.enabled).toBe(true)
      expect(normalized!.slots).toEqual([])
      expect(normalized!.activationEvents).toEqual([])
      expect(normalized!.dependencies).toEqual({})
      expect(normalized!.contributes).toEqual({})
      expect(normalized!.capabilities).toEqual({})
      expect(normalized!.metadata).toEqual({})
    })

    it('should preserve existing values during normalization', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        enabled: false,
        slots: ['header', 'footer'],
        activationEvents: ['onStartup'],
        dependencies: {
          plugins: [{ id: 'base-plugin' }]
        },
        contributes: {
          commands: []
        },
        capabilities: {
          auth: true
        },
        metadata: {
          category: 'ui'
        }
      }

      const { manifest: normalized, result } = validator.validateAndNormalize(manifest)
      
      expect(result.valid).toBe(true)
      expect(normalized).not.toBeNull()
      expect(normalized!.enabled).toBe(false)
      expect(normalized!.slots).toEqual(['header', 'footer'])
      expect(normalized!.activationEvents).toEqual(['onStartup'])
      expect(normalized!.dependencies).toEqual({ plugins: [{ id: 'base-plugin' }] })
      expect(normalized!.contributes).toEqual({ commands: [] })
      expect(normalized!.capabilities).toEqual({ auth: true })
      expect(normalized!.metadata).toEqual({ category: 'ui' })
    })

    it('should return null manifest when validation fails', () => {
      const manifest = {
        name: 'Test Plugin',
        version: '1.0.0'
        // Missing required fields
      }

      const { manifest: normalized, result } = validator.validateAndNormalize(manifest)
      
      expect(result.valid).toBe(false)
      expect(normalized).toBeNull()
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Field Type Validation', () => {
    it('should fail validation when string field is not a string', () => {
      const manifest = {
        id: 123,
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'id',
        message: "Field 'id' must be a string",
        severity: 'error'
      })
    })

    it('should warn when enabled is not a boolean', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        enabled: 'true'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContainEqual({
        field: 'enabled',
        message: "Field 'enabled' should be a boolean, defaulting to true",
        severity: 'warning'
      })
    })

    it('should fail validation when slots is not an array', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        slots: 'header'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'slots',
        message: "Field 'slots' must be an array",
        severity: 'error'
      })
    })

    it('should fail validation when metadata is not an object', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        metadata: 'invalid'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'metadata',
        message: "Field 'metadata' must be an object",
        severity: 'error'
      })
    })
  })

  describe('Optional Fields', () => {
    it('should pass validation with optional fields', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        license: 'MIT',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/test-plugin'
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation when optional string field has wrong type', () => {
      const manifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        entry: './dist/index.js',
        license: 123
      }

      const result = validator.validate(manifest)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'license',
        message: "Field 'license' must be a string",
        severity: 'error'
      })
    })
  })
})
