/**
 * Resource Registry Types
 * 
 * Provides generic resource registration and access mechanism.
 * Applications can use this to share components, utilities, constants, etc.
 */

/**
 * Resource descriptor
 */
export interface ResourceDescriptor<T = any> {
  /** Unique resource identifier */
  id: string
  
  /** Resource type (e.g., 'component', 'utility', 'constant') */
  type: string
  
  /** The actual resource value */
  value: T
  
  /** Optional metadata */
  metadata?: {
    /** Resource version */
    version?: string
    
    /** Whether the resource is deprecated */
    deprecated?: boolean
    
    /** Deprecation message */
    deprecationMessage?: string
    
    /** Resource tags for categorization */
    tags?: string[]
    
    /** Additional custom metadata */
    [key: string]: any
  }
}

/**
 * Resource Registry Interface
 * 
 * Manages registration and retrieval of resources across plugins.
 */
export interface ResourceRegistry {
  /**
   * Register a single resource
   * @param descriptor - Resource descriptor
   */
  register<T>(descriptor: ResourceDescriptor<T>): void
  
  /**
   * Register multiple resources at once
   * @param descriptors - Array of resource descriptors
   */
  registerBatch(descriptors: ResourceDescriptor[]): void
  
  /**
   * Get a resource by ID
   * @param id - Resource identifier
   * @returns The resource value or null if not found
   */
  get<T>(id: string): T | null
  
  /**
   * Get all resources of a specific type
   * @param type - Resource type
   * @returns Array of resource values
   */
  getByType<T>(type: string): T[]
  
  /**
   * Get all registered resources
   * @returns Array of all resource descriptors
   */
  getAll(): ResourceDescriptor[]
  
  /**
   * Check if a resource exists
   * @param id - Resource identifier
   * @returns True if the resource exists
   */
  has(id: string): boolean
  
  /**
   * Unregister a resource by ID
   * @param id - Resource identifier
   */
  unregister(id: string): void
  
  /**
   * Unregister all resources of a specific type
   * @param type - Resource type
   */
  unregisterByType(type: string): void
  
  /**
   * Query resources using a filter function
   * @param filter - Filter function
   * @returns Array of matching resource descriptors
   */
  query(filter: (descriptor: ResourceDescriptor) => boolean): ResourceDescriptor[]
}
