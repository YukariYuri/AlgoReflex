import type { KnowledgeNodeRef } from '@algoreflex/contracts';

export interface GraphNode<T = unknown> {
  id: string;
  metadata?: T;
}

export class CycleDetectedError extends Error {
  constructor(public readonly cyclePath: string[]) {
    super(`Cycle detected in prerequisite graph: ${cyclePath.join(' -> ')}`);
    this.name = 'CycleDetectedError';
  }
}

/**
 * Manages a Directed Acyclic Graph (DAG) of curriculum prerequisites.
 * Authoritative single source of truth for curriculum dependencies.
 *
 * Supports cross-type prerequisite relationships (e.g. CONCEPT -> TOOL, TOOL -> PATTERN).
 */
export class PrerequisiteGraph<T = unknown> {
  private readonly nodes: Map<string, GraphNode<T>> = new Map();
  // adjacency list: prereqId -> Set of dependent nodeIds
  private readonly dependents: Map<string, Set<string>> = new Map();
  // reverse adjacency: nodeId -> Set of prerequisite nodeIds
  private readonly prerequisites: Map<string, Set<string>> = new Map();

  /**
   * Helper to format a typed KnowledgeNodeRef into a canonical graph key.
   */
  public static toNodeKey(ref: KnowledgeNodeRef): string {
    return `${ref.type}:${ref.id}`;
  }

  public addNode(id: string, metadata?: T): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, metadata });
      this.dependents.set(id, new Set());
      this.prerequisites.set(id, new Set());
    }
  }

  public addEdge(prereqId: string, dependentId: string): void {
    this.addNode(prereqId);
    this.addNode(dependentId);

    const deps = this.dependents.get(prereqId);
    if (deps) {
      deps.add(dependentId);
    }
    const prereqs = this.prerequisites.get(dependentId);
    if (prereqs) {
      prereqs.add(prereqId);
    }

    // Verify DAG invariant
    if (this.hasCycle()) {
      // rollback
      deps?.delete(dependentId);
      prereqs?.delete(prereqId);
      throw new CycleDetectedError([prereqId, dependentId, prereqId]);
    }
  }

  /**
   * Adds an edge between two typed KnowledgeNodeRefs.
   * e.g. CONCEPT:monotonicity -> TOOL:lower_bound
   */
  public addTypedEdge(prereq: KnowledgeNodeRef, dependent: KnowledgeNodeRef): void {
    this.addEdge(
      PrerequisiteGraph.toNodeKey(prereq),
      PrerequisiteGraph.toNodeKey(dependent)
    );
  }

  public hasCycle(): boolean {
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      inStack.add(nodeId);

      const neighbors = this.dependents.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (inStack.has(neighbor)) {
          return true;
        }
      }

      inStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) return true;
      }
    }

    return false;
  }

  public getTopologicalOrder(): string[] {
    const inDegree: Map<string, number> = new Map();
    for (const nodeId of this.nodes.keys()) {
      inDegree.set(nodeId, this.prerequisites.get(nodeId)?.size || 0);
    }

    const queue: string[] = [];
    for (const [nodeId, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(nodeId);
      }
    }

    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = this.dependents.get(current) || new Set();
      for (const neighbor of neighbors) {
        const updated = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, updated);
        if (updated === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (result.length !== this.nodes.size) {
      throw new Error('Graph has cycles or disconnected invalid dependencies');
    }

    return result;
  }

  /**
   * Returns nodes whose prerequisites are all satisfied by the given set of mastered nodes,
   * excluding already mastered nodes.
   */
  public getAvailableNext(masteredIds: Set<string>): string[] {
    const available: string[] = [];
    for (const [nodeId, prereqs] of this.prerequisites.entries()) {
      if (masteredIds.has(nodeId)) {
        continue;
      }
      const allSatisfied = Array.from(prereqs).every(p => masteredIds.has(p));
      if (allSatisfied) {
        available.push(nodeId);
      }
    }
    return available;
  }

  /**
   * Returns all transitive prerequisites for a given target node.
   */
  public getPrerequisitePath(targetId: string): string[] {
    if (!this.nodes.has(targetId)) {
      return [];
    }
    const visited = new Set<string>();

    const dfs = (id: string) => {
      const prereqs = this.prerequisites.get(id) || new Set();
      for (const p of prereqs) {
        if (!visited.has(p)) {
          visited.add(p);
          dfs(p);
        }
      }
    };

    dfs(targetId);
    return Array.from(visited);
  }

  public getNodeCount(): number {
    return this.nodes.size;
  }
}
