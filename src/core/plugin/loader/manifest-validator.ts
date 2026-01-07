/**
 * Manifest Validator - Validates plugin manifests
 */

import { PluginManifest } from '../../types/plugin'
import { debugLog, warnLog } from '../../utils'

export interface ManifestValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ManifestValidationResult {
  valid: boolean
  errors: ManifestValidationError[]
  warnings: ManifestValidationError[]
}

/**
 * Validates plugin manifests according to requirements 5.2 and 5.5
 */
export class ManifestValidator {
  /**
   * Validate a plugin manifest
   * Requirements: 5.2 (missing dependencies), 5.5 (version compatibility)
   */
  validate(manifest: any): ManifestValidationResult {
    const errors: ManifestValidationError[] = []
    const warnings: ManifestValidationError[] = []

    // Validate required fields
    this.validateRequiredFields(manifest, errors)

    // Validate field types
    this.validateFieldTypes(manifest, errors, warnings)

    // Validate dependencies
    this.validateDependencies(manifest, errors, warnings)

    // Validate version format
    this.validateVersion(manifest, errors)

    // Validate activation events
    this.validateActivationEvents(manifest, warnings)

    // Validate contributes
    this.validateContributes(manifest, warnings)

    // Validate capabilities
    this.validateCapabilities(manifest, warnings)

    const valid = errors.length === 0

    if (!valid) {
      debugLog(`Manifest validation failed for ${manifest?.id || 'unknown'}`, { 
        operation: 'manifest-validation',
        errorCount: errors.length,
        warningCount: warnings.length
      })
    }

    return { valid, errors, warnings }
  }

  /**
   * Validate required fields (Requirement 5.2)
   */
  private validateRequiredFields(manifest: any, errors: ManifestValidationError[]): void {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'entry']

    for (const field of requiredFields) {
      if (!manifest || manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
        errors.push({
          field,
          message: `Required field '${field}' is missing or empty`,
          severity: 'error'
        })
      }
    }
  }

  /**
   * Validate field types
   */
  private validateFieldTypes(manifest: any, errors: ManifestValidationError[], warnings: ManifestValidationError[]): void {
    if (!manifest) return

    // String fields
    const stringFields = ['id', 'name', 'version', 'description', 'author', 'entry', 'license', 'homepage', 'repository']
    for (const field of stringFields) {
      if (manifest[field] !== undefined && typeof manifest[field] !== 'string') {
        errors.push({
          field,
          message: `Field '${field}' must be a string`,
          severity: 'error'
        })
      }
    }

    // Boolean fields
    if (manifest.enabled !== undefined && typeof manifest.enabled !== 'boolean') {
      warnings.push({
        field: 'enabled',
        message: `Field 'enabled' should be a boolean, defaulting to true`,
        severity: 'warning'
      })
    }

    // Array fields
    if (manifest.slots !== undefined && !Array.isArray(manifest.slots)) {
      errors.push({
        field: 'slots',
        message: `Field 'slots' must be an array`,
        severity: 'error'
      })
    }

    if (manifest.activationEvents !== undefined && !Array.isArray(manifest.activationEvents)) {
      errors.push({
        field: 'activationEvents',
        message: `Field 'activationEvents' must be an array`,
        severity: 'error'
      })
    }

    // Object fields
    if (manifest.dependencies !== undefined && typeof manifest.dependencies !== 'object') {
      errors.push({
        field: 'dependencies',
        message: `Field 'dependencies' must be an object`,
        severity: 'error'
      })
    }

    if (manifest.contributes !== undefined && typeof manifest.contributes !== 'object') {
      errors.push({
        field: 'contributes',
        message: `Field 'contributes' must be an object`,
        severity: 'error'
      })
    }

    if (manifest.capabilities !== undefined && typeof manifest.capabilities !== 'object') {
      errors.push({
        field: 'capabilities',
        message: `Field 'capabilities' must be an object`,
        severity: 'error'
      })
    }

    if (manifest.metadata !== undefined && typeof manifest.metadata !== 'object') {
      errors.push({
        field: 'metadata',
        message: `Field 'metadata' must be an object`,
        severity: 'error'
      })
    }
  }

  /**
   * Validate dependencies (Requirements 5.2, 5.5)
   */
  private validateDependencies(manifest: any, errors: ManifestValidationError[], warnings: ManifestValidationError[]): void {
    if (!manifest || !manifest.dependencies) return

    const deps = manifest.dependencies

    // Validate plugin dependencies
    if (deps.plugins !== undefined) {
      if (!Array.isArray(deps.plugins)) {
        errors.push({
          field: 'dependencies.plugins',
          message: `Field 'dependencies.plugins' must be an array`,
          severity: 'error'
        })
      } else {
        deps.plugins.forEach((dep: any, index: number) => {
          if (!dep.id || typeof dep.id !== 'string') {
            errors.push({
              field: `dependencies.plugins[${index}].id`,
              message: `Plugin dependency must have a valid 'id' field`,
              severity: 'error'
            })
          }

          // Validate version format if provided (Requirement 5.5)
          if (dep.version !== undefined) {
            if (typeof dep.version !== 'string') {
              errors.push({
                field: `dependencies.plugins[${index}].version`,
                message: `Version must be a string`,
                severity: 'error'
              })
            } else if (!this.isValidSemverRange(dep.version)) {
              warnings.push({
                field: `dependencies.plugins[${index}].version`,
                message: `Version '${dep.version}' may not be a valid semver range`,
                severity: 'warning'
              })
            }
          }

          if (dep.optional !== undefined && typeof dep.optional !== 'boolean') {
            warnings.push({
              field: `dependencies.plugins[${index}].optional`,
              message: `Field 'optional' should be a boolean`,
              severity: 'warning'
            })
          }
        })
      }
    }

    // Validate service dependencies
    if (deps.services !== undefined) {
      if (!Array.isArray(deps.services)) {
        errors.push({
          field: 'dependencies.services',
          message: `Field 'dependencies.services' must be an array`,
          severity: 'error'
        })
      } else {
        deps.services.forEach((dep: any, index: number) => {
          if (!dep.interface || (typeof dep.interface !== 'string' && typeof dep.interface !== 'symbol')) {
            errors.push({
              field: `dependencies.services[${index}].interface`,
              message: `Service dependency must have a valid 'interface' field`,
              severity: 'error'
            })
          }

          if (dep.optional !== undefined && typeof dep.optional !== 'boolean') {
            warnings.push({
              field: `dependencies.services[${index}].optional`,
              message: `Field 'optional' should be a boolean`,
              severity: 'warning'
            })
          }
        })
      }
    }
  }

  /**
   * Validate version format (Requirement 5.5)
   */
  private validateVersion(manifest: any, errors: ManifestValidationError[]): void {
    if (!manifest || !manifest.version) return

    // Basic semver validation (x.y.z format)
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/
    if (!semverRegex.test(manifest.version)) {
      errors.push({
        field: 'version',
        message: `Version '${manifest.version}' is not a valid semver format (expected x.y.z)`,
        severity: 'error'
      })
    }
  }

  /**
   * Validate activation events
   */
  private validateActivationEvents(manifest: any, warnings: ManifestValidationError[]): void {
    if (!manifest || !manifest.activationEvents) return

    if (!Array.isArray(manifest.activationEvents)) return

    manifest.activationEvents.forEach((event: any, index: number) => {
      if (typeof event !== 'string') {
        warnings.push({
          field: `activationEvents[${index}]`,
          message: `Activation event must be a string`,
          severity: 'warning'
        })
      } else if (event.trim() === '') {
        warnings.push({
          field: `activationEvents[${index}]`,
          message: `Activation event cannot be empty`,
          severity: 'warning'
        })
      }
    })
  }

  /**
   * Validate contributes field
   */
  private validateContributes(manifest: any, warnings: ManifestValidationError[]): void {
    if (!manifest || !manifest.contributes) return

    if (typeof manifest.contributes !== 'object' || Array.isArray(manifest.contributes)) {
      // Already validated in validateFieldTypes
      return
    }

    // Warn if contributes is empty
    if (Object.keys(manifest.contributes).length === 0) {
      warnings.push({
        field: 'contributes',
        message: `Field 'contributes' is empty`,
        severity: 'warning'
      })
    }
  }

  /**
   * Validate capabilities field
   */
  private validateCapabilities(manifest: any, warnings: ManifestValidationError[]): void {
    if (!manifest || !manifest.capabilities) return

    if (typeof manifest.capabilities !== 'object' || Array.isArray(manifest.capabilities)) {
      // Already validated in validateFieldTypes
      return
    }

    // Warn if capabilities is empty
    if (Object.keys(manifest.capabilities).length === 0) {
      warnings.push({
        field: 'capabilities',
        message: `Field 'capabilities' is empty`,
        severity: 'warning'
      })
    }
  }

  /**
   * Check if a string is a valid semver range
   * Basic validation for common patterns
   */
  private isValidSemverRange(version: string): boolean {
    // Common semver range patterns
    const patterns = [
      /^\d+\.\d+\.\d+$/, // Exact: 1.2.3
      /^\^?\d+\.\d+\.\d+$/, // Caret: ^1.2.3
      /^~?\d+\.\d+\.\d+$/, // Tilde: ~1.2.3
      /^>=?\d+\.\d+\.\d+$/, // Greater than: >=1.2.3
      /^<=?\d+\.\d+\.\d+$/, // Less than: <=1.2.3
      /^\d+\.\d+\.x$/, // Wildcard: 1.2.x
      /^\d+\.x\.x$/, // Wildcard: 1.x.x
      /^\*$/, // Any: *
    ]

    return patterns.some(pattern => pattern.test(version))
  }

  /**
   * Validate and normalize a manifest
   * Applies defaults and returns a normalized manifest
   */
  validateAndNormalize(manifest: any): { manifest: PluginManifest | null; result: ManifestValidationResult } {
    const result = this.validate(manifest)

    if (!result.valid) {
      return { manifest: null, result }
    }

    // Apply defaults
    const normalized: PluginManifest = {
      ...manifest,
      enabled: manifest.enabled !== undefined ? manifest.enabled : true,
      slots: manifest.slots || [],
      activationEvents: manifest.activationEvents || [],
      dependencies: manifest.dependencies || {},
      contributes: manifest.contributes || {},
      capabilities: manifest.capabilities || {},
      metadata: manifest.metadata || {}
    }

    return { manifest: normalized, result }
  }
}
