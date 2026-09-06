import { describe, it, expect } from 'vitest';
import { PrerequisiteGraph, CycleDetectedError } from '../src/prerequisite-graph.js';
import type { KnowledgeNodeRef } from '@algoreflex/contracts';

describe('PrerequisiteGraph', () => {
  it('correctly constructs DAG with KnowledgeNodeRef and returns topological ordering', () => {
    const graph = new PrerequisiteGraph();

    const syntax: KnowledgeNodeRef = { type: 'CONCEPT', id: 'cpp-syntax' };
    const loops: KnowledgeNodeRef = { type: 'CONCEPT', id: 'cpp-loops' };
    const arrays: KnowledgeNodeRef = { type: 'CONCEPT', id: 'cpp-arrays' };
    const prefixSum: KnowledgeNodeRef = { type: 'CONCEPT', id: 'prefix-sum' };
    const functions: KnowledgeNodeRef = { type: 'CONCEPT', id: 'cpp-functions' };

    graph.addEdge(syntax, loops);
    graph.addEdge(loops, arrays);
    graph.addEdge(arrays, prefixSum);
    graph.addEdge(syntax, functions);

    const order = graph.getTopologicalOrder();
    const orderKeys = graph.getTopologicalOrderKeys();

    expect(order.length).toBe(5);

    // Verify ordering constraints: prerequisite must appear before dependent
    expect(orderKeys.indexOf('CONCEPT:cpp-syntax')).toBeLessThan(
      orderKeys.indexOf('CONCEPT:cpp-loops')
    );
    expect(orderKeys.indexOf('CONCEPT:cpp-loops')).toBeLessThan(
      orderKeys.indexOf('CONCEPT:cpp-arrays')
    );
    expect(orderKeys.indexOf('CONCEPT:cpp-arrays')).toBeLessThan(
      orderKeys.indexOf('CONCEPT:prefix-sum')
    );
    expect(orderKeys.indexOf('CONCEPT:cpp-syntax')).toBeLessThan(
      orderKeys.indexOf('CONCEPT:cpp-functions')
    );
  });

  it('authoritatively enforces cross-type prerequisite edges: CONCEPT -> TOOL -> PATTERN -> LESSON', () => {
    const graph = new PrerequisiteGraph();

    const concept: KnowledgeNodeRef = { type: 'CONCEPT', id: 'monotonicity' };
    const tool: KnowledgeNodeRef = { type: 'TOOL', id: 'std::lower_bound' };
    const pattern: KnowledgeNodeRef = {
      type: 'PATTERN',
      id: 'binary-search-on-answer',
    };
    const lesson: KnowledgeNodeRef = {
      type: 'LESSON',
      id: 'advanced-binary-search',
    };

    graph.addEdge(concept, tool);
    graph.addEdge(tool, pattern);
    graph.addEdge(pattern, lesson);

    const orderKeys = graph.getTopologicalOrderKeys();
    expect(orderKeys.indexOf('CONCEPT:monotonicity')).toBeLessThan(
      orderKeys.indexOf('TOOL:std::lower_bound')
    );
    expect(orderKeys.indexOf('TOOL:std::lower_bound')).toBeLessThan(
      orderKeys.indexOf('PATTERN:binary-search-on-answer')
    );
    expect(orderKeys.indexOf('PATTERN:binary-search-on-answer')).toBeLessThan(
      orderKeys.indexOf('LESSON:advanced-binary-search')
    );

    const path = graph.getPrerequisitePath(lesson);
    const pathKeys = path.map(PrerequisiteGraph.toNodeKey);
    expect(pathKeys).toContain('CONCEPT:monotonicity');
    expect(pathKeys).toContain('TOOL:std::lower_bound');
    expect(pathKeys).toContain('PATTERN:binary-search-on-answer');
  });

  it('detects cycles between typed nodes and throws CycleDetectedError immediately', () => {
    const graph = new PrerequisiteGraph();

    const nodeA: KnowledgeNodeRef = { type: 'CONCEPT', id: 'node-a' };
    const nodeB: KnowledgeNodeRef = { type: 'TOOL', id: 'node-b' };
    const nodeC: KnowledgeNodeRef = { type: 'PATTERN', id: 'node-c' };

    graph.addEdge(nodeA, nodeB);
    graph.addEdge(nodeB, nodeC);

    expect(() => {
      graph.addEdge(nodeC, nodeA); // Cycle!
    }).toThrow(CycleDetectedError);
  });

  it('computes unlockable typed nodes based on current mastered prerequisites', () => {
    const graph = new PrerequisiteGraph();

    const nodeA: KnowledgeNodeRef = { type: 'CONCEPT', id: 'A' };
    const nodeB: KnowledgeNodeRef = { type: 'TOOL', id: 'B' };
    const nodeC: KnowledgeNodeRef = { type: 'PATTERN', id: 'C' };
    const nodeD: KnowledgeNodeRef = { type: 'LESSON', id: 'D' };

    // graph: A -> B -> C, and A -> D
    graph.addEdge(nodeA, nodeB);
    graph.addEdge(nodeB, nodeC);
    graph.addEdge(nodeA, nodeD);

    // No mastered nodes -> only root A is available
    const initialAvailable = graph.getAvailableNext([]);
    expect(initialAvailable.map(PrerequisiteGraph.toNodeKey)).toEqual(['CONCEPT:A']);

    // Mastered A -> B and D become unlocked
    const unlockedAfterA = graph.getAvailableNext([nodeA]);
    const keysAfterA = unlockedAfterA.map(PrerequisiteGraph.toNodeKey).sort();
    expect(keysAfterA).toEqual(['LESSON:D', 'TOOL:B'].sort());

    // Mastered A and B -> D and C become unlocked
    const unlockedAfterAB = graph.getAvailableNext([nodeA, nodeB]);
    const keysAfterAB = unlockedAfterAB.map(PrerequisiteGraph.toNodeKey).sort();
    expect(keysAfterAB).toEqual(['LESSON:D', 'PATTERN:C'].sort());
  });

  it('retrieves transitive typed prerequisite path', () => {
    const graph = new PrerequisiteGraph();

    const nodeA: KnowledgeNodeRef = { type: 'CONCEPT', id: 'A' };
    const nodeB: KnowledgeNodeRef = { type: 'TOOL', id: 'B' };
    const nodeC: KnowledgeNodeRef = { type: 'PATTERN', id: 'C' };
    const nodeD: KnowledgeNodeRef = { type: 'LESSON', id: 'D' };

    graph.addEdge(nodeA, nodeB);
    graph.addEdge(nodeB, nodeC);
    graph.addEdge(nodeC, nodeD);

    const prereqsOfD = graph.getPrerequisitePath(nodeD);
    const prereqKeys = prereqsOfD.map(PrerequisiteGraph.toNodeKey);
    expect(prereqKeys).toContain('CONCEPT:A');
    expect(prereqKeys).toContain('TOOL:B');
    expect(prereqKeys).toContain('PATTERN:C');
    expect(prereqsOfD.length).toBe(3);
  });

  it('correctly parses and serializes canonical node keys', () => {
    const ref: KnowledgeNodeRef = { type: 'TOOL', id: 'std::lower_bound' };
    const key = PrerequisiteGraph.toNodeKey(ref);
    expect(key).toBe('TOOL:std::lower_bound');

    const parsed = PrerequisiteGraph.parseNodeKey(key);
    expect(parsed).toEqual(ref);
  });
});
