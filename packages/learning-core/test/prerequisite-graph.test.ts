import { describe, it, expect } from 'vitest';
import { PrerequisiteGraph, CycleDetectedError } from '../src/prerequisite-graph.js';

describe('PrerequisiteGraph', () => {
  it('correctly constructs DAG and returns topological ordering', () => {
    const graph = new PrerequisiteGraph();

    graph.addEdge('cpp-syntax', 'cpp-loops');
    graph.addEdge('cpp-loops', 'cpp-arrays');
    graph.addEdge('cpp-arrays', 'prefix-sum');
    graph.addEdge('cpp-syntax', 'cpp-functions');

    const order = graph.getTopologicalOrder();

    // Verify ordering constraints: prerequisite must appear before dependent
    expect(order.indexOf('cpp-syntax')).toBeLessThan(order.indexOf('cpp-loops'));
    expect(order.indexOf('cpp-loops')).toBeLessThan(order.indexOf('cpp-arrays'));
    expect(order.indexOf('cpp-arrays')).toBeLessThan(order.indexOf('prefix-sum'));
    expect(order.indexOf('cpp-syntax')).toBeLessThan(order.indexOf('cpp-functions'));
  });

  it('detects cycles and throws CycleDetectedError immediately', () => {
    const graph = new PrerequisiteGraph();

    graph.addEdge('node-a', 'node-b');
    graph.addEdge('node-b', 'node-c');

    expect(() => {
      graph.addEdge('node-c', 'node-a'); // Cycle!
    }).toThrow(CycleDetectedError);
  });

  it('computes unlockable nodes based on current mastered prerequisites', () => {
    const graph = new PrerequisiteGraph();

    // graph: A -> B -> C, and A -> D
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.addEdge('A', 'D');

    // No mastered nodes -> only root A is available
    expect(graph.getAvailableNext(new Set())).toEqual(['A']);

    // Mastered A -> B and D become unlocked
    const unlockedAfterA = graph.getAvailableNext(new Set(['A']));
    expect(unlockedAfterA.sort()).toEqual(['B', 'D'].sort());

    // Mastered A and B -> D and C become unlocked
    const unlockedAfterAB = graph.getAvailableNext(new Set(['A', 'B']));
    expect(unlockedAfterAB.sort()).toEqual(['C', 'D'].sort());
  });

  it('retrieves transitive prerequisite path', () => {
    const graph = new PrerequisiteGraph();

    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.addEdge('C', 'D');

    const prereqsOfD = graph.getPrerequisitePath('D');
    expect(prereqsOfD).toContain('A');
    expect(prereqsOfD).toContain('B');
    expect(prereqsOfD).toContain('C');
    expect(prereqsOfD.length).toBe(3);
  });
});
