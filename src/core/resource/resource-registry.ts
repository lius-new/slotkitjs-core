/**
 * Resource Registry Implementation
 * 
 * Provides a centralized registry for managing resources across plugins.
 */

import type { ResourceDescriptor, ResourceRegistry } from './types'

/**
 * Default implementation of ResourceRegistry
 */
export class ResourceRegistryImpl implements ResourceRegistry {
  private resources: Map<string, ResourceDescriptor>
  
  constructor() {
    this.resources = new Map()
  }
  
  /**
   * Register a single resource
   */
  register<T>(descriptor: ResourceDescriptor<T>): void {
    if (this.resources.has(descriptor.id)) {
      console.warn(`Resource with id "${descriptor.id}" is already registered. Overwriting.`)
    }
    
    this.resources.set(descriptor.id, descriptor)
  }
  
  /**
   * Register multiple resources at once
   */
  registerBatch(descriptors: ResourceDescriptor[]): void {
    for (const descriptor of descriptors) {
      this.register(descriptor)
    }
  }
  
  /**
   * Get a resource by ID
   */
  get<T>(id: string): T | null {
    const descriptor = this.resources.get(id)
    return descriptor ? (descriptor.value as T) : null
  }
  
  /**
   * Get all resources of a specific type
   */
  getByType<T>(type: string): T[] {
    const results: T[] = []
    
    for (const descriptor of this.resources.values()) {
      if (descriptor.type === type) {
        results.push(descriptor.value as T)
      }
    }
    
    return results
  }
  
  /**
   * Get all registered resources
   */
  getAll(): ResourceDescriptor[] {
    return Array.from(this.resources.values())
  }
  
  /**
   * Check if a resource exists
   */
  has(id: string): boolean {
    return this.resources.has(id)
  }
  
  /**
   * Unregister a resource by ID
   */
  unregister(id: string): void {
    this.resources.delete(id)
  }
  
  /**
   * Unregister all resources of a specific type
   */
  unregisterByType(type: string): void {
    const idsToRemove: string[] = []
    
    for (const [id, descriptor] of this.resources.entries()) {
      if (descriptor.type === type) {
        idsToRemove.push(id)
      }
    }
    
    for (const id of idsToRemove) {
      this.resources.delete(id)
    }
  }
  
  /**
   * Query resources using a filter function
   */
  query(filter: (descriptor: ResourceDescriptor) => boolean): ResourceDescriptor[] {
    const results: ResourceDescriptor[] = []
    
    for (const descriptor of this.resources.values()) {
      if (filter(descriptor)) {
        results.push(descriptor)
      }
    }
    
    return results
  }
}

/**
 * Create a new resource registry instance
 */
export function createResourceRegistry(): ResourceRegistry {
  return new ResourceRegistryImpl()
}
