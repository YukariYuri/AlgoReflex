import type { KnowledgeNodeRef, KnowledgeNodeType } from '@algoreflex/contracts';

export interface GraphNode<T = unknown> {
  ref: KnowledgeNodeRef;
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
 * Operates strictly on typed KnowledgeNodeRef keys (e.g. { type: 'CONCEPT', id: 'monotonicity' }).
 * Supports cross-type prerequisite relationships (e.g. CONCEPT -> TOOL, TOOL -> PATTERN, PATTERN -> LESSON).
 */
export class PrerequisiteGraph<T = unknown> {
  private readonly nodes: Map<string, GraphNode<T>> = new Map();
  // adjacency list: prereqKey -> Set of dependent nodeKeys
  private readonly dependents: Map<string, Set<string>> = new Map();
  // reverse adjacency: nodeKey -> Set of prerequisite nodeKeys
  private readonly prerequisites: Map<string, Set<string>> = new Map();

  /**
   * Formats a typed KnowledgeNodeRef into a canonical graph key.
   * e.g. CONCEPT:monotonicity, TOOL:std::lower_bound
   */
  public static toNodeKey(ref: KnowledgeNodeRef): string {
    return `${ref.type}:${ref.id}`;
  }

  /**
   * Parses a canonical graph key back into a typed KnowledgeNodeRef.
   */
  public static parseNodeKey(key: string): KnowledgeNodeRef {
    const colonIdx = key.indexOf(':');
    if (colonIdx === -1) {
      throw new Error(`Invalid canonical node key: ${key}`);
    }
    return {
      type: key.slice(0, colonIdx) as KnowledgeNodeType,
      id: key.slice(colonIdx + 1),
    };
  }

  /**
   * Internal helper to register a node by its canonical key.
   */
  private addNodeByKey(key: string, ref: KnowledgeNodeRef, metadata?: T): void {
    if (!this.nodes.has(key)) {
      this.nodes.set(key, { ref, metadata });
      this.dependents.set(key, new Set());
      this.prerequisites.set(key, new Set());
    }
  }

  /**
   * Internal helper to register a directed edge by canonical keys with cycle verification.
   */
  private addEdgeByKey(requiredKey: string, targetKey: string): void {
    const deps = this.dependents.get(requiredKey);
    if (deps) {
      deps.add(targetKey);
    }
    const prereqs = this.prerequisites.get(targetKey);
    if (prereqs) {
      prereqs.add(requiredKey);
    }

    // Verify DAG invariant
    if (this.hasCycle()) {
      // rollback
      deps?.delete(targetKey);
      prereqs?.delete(requiredKey);
      throw new CycleDetectedError([requiredKey, targetKey, requiredKey]);
    }
  }

  /**
   * Registers a node into the graph using a typed KnowledgeNodeRef.
   */
  public addNode(ref: KnowledgeNodeRef, metadata?: T): void {
    const key = PrerequisiteGraph.toNodeKey(ref);
    this.addNodeByKey(key, ref, metadata);
  }

  /**
   * Adds a directed prerequisite edge: required -> target.
   * target requires required to be completed/mastered first.
   */
  public addEdge(required: KnowledgeNodeRef, target: KnowledgeNodeRef): void {
    this.addNode(required);
    this.addNode(target);

    const requiredKey = PrerequisiteGraph.toNodeKey(required);
    const targetKey = PrerequisiteGraph.toNodeKey(target);

    this.addEdgeByKey(requiredKey, targetKey);
  }

  public hasNode(ref: KnowledgeNodeRef): boolean {
    return this.nodes.has(PrerequisiteGraph.toNodeKey(ref));
  }

  public getNode(ref: KnowledgeNodeRef): GraphNode<T> | undefined {
    return this.nodes.get(PrerequisiteGraph.toNodeKey(ref));
  }

  public getNodeCount(): number {
    return this.nodes.size;
  }

  public hasCycle(): boolean {
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (nodeKey: string): boolean => {
      visited.add(nodeKey);
      inStack.add(nodeKey);

      const neighbors = this.dependents.get(nodeKey) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (inStack.has(neighbor)) {
          return true;
        }
      }

      inStack.delete(nodeKey);
      return false;
    };

    for (const nodeKey of this.nodes.keys()) {
      if (!visited.has(nodeKey)) {
        if (dfs(nodeKey)) return true;
      }
    }

    return false;
  }

  /**
   * Returns nodes in topological order as typed KnowledgeNodeRefs.
   */
  public getTopologicalOrder(): KnowledgeNodeRef[] {
    const inDegree: Map<string, number> = new Map();
    for (const nodeKey of this.nodes.keys()) {
      inDegree.set(nodeKey, this.prerequisites.get(nodeKey)?.size || 0);
    }

    const queue: string[] = [];
    for (const [nodeKey, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(nodeKey);
      }
    }

    const resultKeys: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      resultKeys.push(current);

      const neighbors = this.dependents.get(current) || new Set();
      for (const neighbor of neighbors) {
        const updated = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, updated);
        if (updated === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (resultKeys.length !== this.nodes.size) {
      throw new Error('Graph has cycles or disconnected invalid dependencies');
    }

    return resultKeys.map(key => this.nodes.get(key)!.ref);
  }

  /**
   * Returns canonical keys in topological order (convenience helper).
   */
  public getTopologicalOrderKeys(): string[] {
    return this.getTopologicalOrder().map(PrerequisiteGraph.toNodeKey);
  }

  /**
   * Returns typed nodes whose prerequisites are all satisfied by the given set of mastered nodes,
   * excluding already mastered nodes.
   *
   * Accepts an iterable of KnowledgeNodeRefs or a Set of canonical keys.
   */
  public getAvailableNext(
    mastered: Iterable<KnowledgeNodeRef> | Set<string>
  ): KnowledgeNodeRef[] {
    const masteredKeys = new Set<string>();
    for (const item of mastered) {
      if (typeof item === 'string') {
        masteredKeys.add(item);
      } else {
        masteredKeys.add(PrerequisiteGraph.toNodeKey(item));
      }
    }

    const available: KnowledgeNodeRef[] = [];
    for (const [nodeKey, prereqs] of this.prerequisites.entries()) {
      if (masteredKeys.has(nodeKey)) {
        continue;
      }
      const allSatisfied = Array.from(prereqs).every(p => masteredKeys.has(p));
      if (allSatisfied) {
        available.push(this.nodes.get(nodeKey)!.ref);
      }
    }
    return available;
  }

  /**
   * Returns all transitive prerequisites for a given target node as typed KnowledgeNodeRefs.
   */
  public getPrerequisitePath(target: KnowledgeNodeRef): KnowledgeNodeRef[] {
    const targetKey = PrerequisiteGraph.toNodeKey(target);
    if (!this.nodes.has(targetKey)) {
      return [];
    }
    const visited = new Set<string>();

    const dfs = (key: string) => {
      const prereqs = this.prerequisites.get(key) || new Set();
      for (const p of prereqs) {
        if (!visited.has(p)) {
          visited.add(p);
          dfs(p);
        }
      }
    };

    dfs(targetKey);
    return Array.from(visited).map(key => this.nodes.get(key)!.ref);
  }
}
