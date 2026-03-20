import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  Button,
  Badge,
  Loader,
  Modal,
  Select,
  NumberInput,
} from '@mantine/core';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  useWorkoutLaddersRetrieveQuery,
  useWorkoutLaddersProgressRetrieveQuery,
  useWorkoutLadderNodesCreateMutation,
  useWorkoutLadderNodesDestroyMutation,
  useWorkoutLadderNodesCriteriaCreateMutation,
  useWorkoutExercisesListQuery,
  useWorkoutProgressListQuery,
  useWorkoutProgressCreateMutation,
  useWorkoutProgressPartialUpdateMutation,
  type LadderNodeRead,
  type CriterionTypeEnum,
} from '../api/generated-api';

interface NodeProgressInfo {
  node_id: number;
  exercise_name: string;
  level: number;
  achieved: boolean;
  achieved_at: string | null;
  criteria: Array<{ criterion_id: number; type: string; params: Record<string, unknown>; met: boolean }>;
  criteria_total: number;
}

function LadderTreeNode({ data }: NodeProps) {
  const nodeData = data as {
    label: string;
    level: number;
    achieved: boolean;
    criteriaProgress: string;
    isCurrentLevel: boolean;
  };

  const bgColor = nodeData.achieved
    ? 'var(--mantine-color-green-9)'
    : nodeData.isCurrentLevel
      ? 'var(--mantine-color-orange-9)'
      : 'var(--mantine-color-dark-6)';

  const borderColor = nodeData.achieved
    ? 'var(--mantine-color-green-6)'
    : nodeData.isCurrentLevel
      ? 'var(--mantine-color-orange-5)'
      : 'var(--mantine-color-dark-4)';

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: bgColor,
          border: `2px solid ${borderColor}`,
          minWidth: 160,
          textAlign: 'center',
        }}
      >
        <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>
          {nodeData.label}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          Level {nodeData.level}
        </div>
        {nodeData.criteriaProgress && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            {nodeData.criteriaProgress}
          </div>
        )}
        {nodeData.achieved && (
          <div style={{ fontSize: 10, color: 'var(--mantine-color-green-4)', marginTop: 2 }}>
            Achieved
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
}

const nodeTypes = { ladderNode: LadderTreeNode };

const CRITERION_TYPE_OPTIONS = [
  { value: 'min_reps_sets', label: 'Min Reps & Sets' },
  { value: 'min_weight', label: 'Min Weight' },
  { value: 'sustained_sessions', label: 'Sustained Sessions' },
  { value: 'min_duration', label: 'Min Duration' },
];

export function LadderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ladder, isLoading } = useWorkoutLaddersRetrieveQuery(
    { id: id! },
    { skip: !id }
  );
  const { data: progressData } = useWorkoutLaddersProgressRetrieveQuery(
    { id: id! },
    { skip: !id }
  );
  const { data: exercisesData } = useWorkoutExercisesListQuery({});
  const { data: progressList } = useWorkoutProgressListQuery({});
  const [createNode] = useWorkoutLadderNodesCreateMutation();
  const [deleteNode] = useWorkoutLadderNodesDestroyMutation();
  const [createCriterion] = useWorkoutLadderNodesCriteriaCreateMutation();
  const [createProgress] = useWorkoutProgressCreateMutation();
  const [updateProgress] = useWorkoutProgressPartialUpdateMutation();

  const [addingNode, setAddingNode] = useState(false);
  const [nodeExerciseId, setNodeExerciseId] = useState<string | null>(null);
  const [nodeLevel, setNodeLevel] = useState<number>(1);
  const [nodePrereqs, setNodePrereqs] = useState<string[]>([]);

  const [addingCriterion, setAddingCriterion] = useState<number | null>(null);
  const [criterionType, setCriterionType] = useState<string | null>(null);
  const [criterionParams, setCriterionParams] = useState<Record<string, number>>({});

  // Map node ID → UserNodeProgress record (for working weight)
  const progressRecordMap = useMemo(() => {
    const map = new Map<number, { id: number; working_weight: string | null }>();
    if (progressList?.results) {
      for (const p of progressList.results) {
        if (p.ladder_node != null && p.id != null) {
          map.set(p.ladder_node, { id: p.id, working_weight: p.working_weight ?? null });
        }
      }
    }
    return map;
  }, [progressList]);

  const handleSaveWeight = useCallback(async (nodeId: number, weight: number | '') => {
    const weightStr = weight === '' ? null : String(weight);
    const existing = progressRecordMap.get(nodeId);
    if (existing) {
      await updateProgress({
        id: String(existing.id),
        patchedUserNodeProgressRequest: { working_weight: weightStr },
      });
    } else {
      await createProgress({
        userNodeProgressRequest: {
          ladder_node_id: nodeId,
          working_weight: weightStr,
        },
      });
    }
  }, [progressRecordMap, updateProgress, createProgress]);

  const progressMap = useMemo(() => {
    const map = new Map<number, NodeProgressInfo>();
    if (progressData?.nodes) {
      for (const n of progressData.nodes as unknown as NodeProgressInfo[]) {
        map.set(n.node_id, n);
      }
    }
    return map;
  }, [progressData]);

  // Find current level (first unachieved node)
  const currentLevel = useMemo(() => {
    if (!ladder?.nodes) return 0;
    const sorted = [...ladder.nodes].sort((a, b) => a.level - b.level);
    for (const node of sorted) {
      const progress = progressMap.get(node.id!);
      if (!progress?.achieved) return node.level;
    }
    const last = sorted[sorted.length - 1];
    return last ? last.level + 1 : 0;
  }, [ladder?.nodes, progressMap]);

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!ladder?.nodes) return { flowNodes: [], flowEdges: [] };

    const nodes = ladder.nodes;
    // Group by level for layout
    const levelGroups = new Map<number, LadderNodeRead[]>();
    for (const node of nodes) {
      const group = levelGroups.get(node.level) ?? [];
      group.push(node);
      levelGroups.set(node.level, group);
    }

    const sortedLevels = [...levelGroups.keys()].sort((a, b) => a - b);

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    for (const level of sortedLevels) {
      const group = levelGroups.get(level)!;
      const levelIndex = sortedLevels.indexOf(level);

      for (let i = 0; i < group.length; i++) {
        const node = group[i]!;
        const progress = progressMap.get(node.id!);
        const metCount = progress?.criteria?.filter((c) => c.met).length ?? 0;
        const totalCount = progress?.criteria_total ?? 0;

        flowNodes.push({
          id: String(node.id),
          type: 'ladderNode',
          position: {
            x: i * 220 - ((group.length - 1) * 220) / 2 + 300,
            y: levelIndex * 140,
          },
          data: {
            label: node.exercise?.name ?? 'Unknown',
            level: node.level,
            achieved: progress?.achieved ?? false,
            criteriaProgress: totalCount > 0 ? `${metCount}/${totalCount} criteria` : '',
            isCurrentLevel: node.level === currentLevel,
          },
        });

        // Edges from prerequisites
        if (node.prerequisites) {
          for (const prereqId of node.prerequisites) {
            flowEdges.push({
              id: `e${prereqId}-${node.id}`,
              source: String(prereqId),
              target: String(node.id),
              animated: node.level === currentLevel,
              style: {
                stroke: progress?.achieved
                  ? 'var(--mantine-color-green-6)'
                  : node.level === currentLevel
                    ? 'var(--mantine-color-orange-5)'
                    : '#555',
              },
            });
          }
        }
      }
    }

    // If no prerequisites set, create implicit level-based edges
    const hasPrereqs = nodes.some((n) => n.prerequisites && n.prerequisites.length > 0);
    if (!hasPrereqs && sortedLevels.length > 1) {
      for (let li = 0; li < sortedLevels.length - 1; li++) {
        const fromLevel = sortedLevels[li] as number;
        const toLevel = sortedLevels[li + 1] as number;
        const fromGroup = levelGroups.get(fromLevel)!;
        const toGroup = levelGroups.get(toLevel)!;
        for (const from of fromGroup) {
          for (const to of toGroup) {
            const toProgress = progressMap.get(to.id!);
            flowEdges.push({
              id: `e${from.id}-${to.id}`,
              source: String(from.id),
              target: String(to.id),
              animated: to.level === currentLevel,
              style: {
                stroke: toProgress?.achieved
                  ? 'var(--mantine-color-green-6)'
                  : to.level === currentLevel
                    ? 'var(--mantine-color-orange-5)'
                    : '#555',
              },
            });
          }
        }
      }
    }

    return { flowNodes, flowEdges };
  }, [ladder?.nodes, progressMap, currentLevel]);

  const handleCreateNode = async () => {
    if (!id || !nodeExerciseId) return;
    await createNode({
      ladderNodeRequest: {
        exercise_id: Number(nodeExerciseId),
        level: nodeLevel,
        prerequisite_ids: nodePrereqs.map(Number),
      },
    });
    setAddingNode(false);
    setNodeExerciseId(null);
    setNodeLevel(1);
    setNodePrereqs([]);
  };

  const handleCreateCriterion = async () => {
    if (!addingCriterion || !criterionType) return;
    await createCriterion({
      id: String(addingCriterion),
      // The codegen types this as LadderNodeRequestWrite but the endpoint
      // actually expects CriterionRequest — we pass the right shape
      ladderNodeRequest: {
        type: criterionType as CriterionTypeEnum,
        params: criterionParams,
      } as any,
    });
    setAddingCriterion(null);
    setCriterionType(null);
    setCriterionParams({});
  };

  const handleDeleteNode = async (nodeId: number) => {
    await deleteNode({ id: String(nodeId) });
  };

  const renderCriterionParams = () => {
    switch (criterionType) {
      case 'min_reps_sets':
        return (
          <Group grow>
            <NumberInput
              label="Sets"
              value={criterionParams.sets ?? ''}
              onChange={(v) => setCriterionParams({ ...criterionParams, sets: Number(v) })}
              min={1}
            />
            <NumberInput
              label="Reps"
              value={criterionParams.reps ?? ''}
              onChange={(v) => setCriterionParams({ ...criterionParams, reps: Number(v) })}
              min={1}
            />
          </Group>
        );
      case 'min_weight':
        return (
          <NumberInput
            label="Weight (kg)"
            value={criterionParams.weight ?? ''}
            onChange={(v) => setCriterionParams({ weight: Number(v) })}
            min={0}
            decimalScale={1}
          />
        );
      case 'sustained_sessions':
        return (
          <Group grow>
            <NumberInput
              label="Sessions"
              value={criterionParams.sessions ?? ''}
              onChange={(v) => setCriterionParams({ ...criterionParams, sessions: Number(v) })}
              min={1}
            />
            <NumberInput
              label="Reps"
              value={criterionParams.reps ?? ''}
              onChange={(v) => setCriterionParams({ ...criterionParams, reps: Number(v) })}
              min={1}
            />
          </Group>
        );
      case 'min_duration':
        return (
          <NumberInput
            label="Seconds"
            value={criterionParams.seconds ?? ''}
            onChange={(v) => setCriterionParams({ seconds: Number(v) })}
            min={1}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading || !ladder) return <Loader />;

  const exerciseOptions = (exercisesData?.results ?? []).map((e) => ({
    value: String(e.id),
    label: e.name,
  }));

  const existingNodeOptions = (ladder.nodes ?? []).map((n) => ({
    value: String(n.id),
    label: `${n.exercise?.name ?? 'Unknown'} (L${n.level})`,
  }));

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Button variant="subtle" size="xs" onClick={() => navigate('/ladders')} mb={4}>
            Back to Ladders
          </Button>
          <Title order={2}>{ladder.name || 'Empty Ladder'}</Title>
          {ladder.description && <Text size="sm" c="dimmed">{ladder.description}</Text>}
        </div>
        <Button size="xs" onClick={() => setAddingNode(true)}>
          + Add Node
        </Button>
      </Group>

      {/* Tech Tree Visualization */}
      {flowNodes.length > 0 ? (
        <Card withBorder p={0} style={{ height: 400 }}>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </Card>
      ) : (
        <Card withBorder p="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed">No nodes yet</Text>
            <Text size="sm" c="dimmed">
              Add exercise nodes to build the progression tree
            </Text>
          </Stack>
        </Card>
      )}

      {/* Node List */}
      {(ladder.nodes ?? []).length > 0 && (
        <>
          <Title order={4}>Nodes</Title>
          <Stack gap="xs">
            {[...(ladder.nodes ?? [])]
              .sort((a, b) => a.level - b.level)
              .map((node) => {
                const progress = progressMap.get(node.id!);
                return (
                  <Card key={node.id} withBorder p="sm">
                    <Group justify="space-between">
                      <div>
                        <Group gap="xs">
                          <Text fw={600}>{node.exercise?.name}</Text>
                          <Badge
                            size="xs"
                            variant="light"
                            color={progress?.achieved ? 'green' : node.level === currentLevel ? 'orange' : 'gray'}
                          >
                            Level {node.level}
                          </Badge>
                          {progress?.achieved && (
                            <Badge size="xs" variant="light" color="green">
                              Achieved
                            </Badge>
                          )}
                        </Group>
                        {node.criteria && node.criteria.length > 0 && (
                          <Stack gap={2} mt={4}>
                            {node.criteria.map((c) => {
                              const criterionProgress = progress?.criteria?.find(
                                (cp) => cp.criterion_id === c.id
                              );
                              return (
                                <Text key={c.id} size="xs" c="dimmed">
                                  <Badge
                                    size="xs"
                                    variant="dot"
                                    color={criterionProgress?.met ? 'green' : 'gray'}
                                    mr={4}
                                  >
                                    {c.type?.replace(/_/g, ' ')}
                                  </Badge>
                                  {JSON.stringify(c.params)}
                                </Text>
                              );
                            })}
                          </Stack>
                        )}
                      </div>
                      <Group gap="xs">
                        <NumberInput
                          size="xs"
                          placeholder="kg"
                          label="Working wt"
                          w={90}
                          decimalScale={1}
                          min={0}
                          value={
                            progressRecordMap.get(node.id!)?.working_weight
                              ? Number(progressRecordMap.get(node.id!)!.working_weight)
                              : ''
                          }
                          onBlur={(e) => {
                            const val = e.currentTarget.value;
                            handleSaveWeight(node.id!, val ? Number(val) : '');
                          }}
                        />
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => setAddingCriterion(node.id!)}
                        >
                          + Criterion
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteNode(node.id!)}
                        >
                          Delete
                        </Button>
                      </Group>
                    </Group>
                  </Card>
                );
              })}
          </Stack>
        </>
      )}

      {/* Add Node Modal */}
      <Modal
        opened={addingNode}
        onClose={() => setAddingNode(false)}
        title="Add Node"
        size="sm"
      >
        <Stack>
          <Select
            label="Exercise"
            placeholder="Select exercise"
            data={exerciseOptions}
            value={nodeExerciseId}
            onChange={setNodeExerciseId}
            searchable
          />
          <NumberInput
            label="Level"
            value={nodeLevel}
            onChange={(v) => setNodeLevel(Number(v))}
            min={1}
          />
          <Select
            label="Prerequisites (optional)"
            placeholder="Select prerequisite nodes"
            data={existingNodeOptions}
            value={nodePrereqs[0] ?? null}
            onChange={(v) => setNodePrereqs(v ? [v] : [])}
            clearable
          />
          <Button onClick={handleCreateNode} disabled={!nodeExerciseId}>
            Add Node
          </Button>
        </Stack>
      </Modal>

      {/* Add Criterion Modal */}
      <Modal
        opened={addingCriterion !== null}
        onClose={() => setAddingCriterion(null)}
        title="Add Criterion"
        size="sm"
      >
        <Stack>
          <Select
            label="Type"
            placeholder="Select criterion type"
            data={CRITERION_TYPE_OPTIONS}
            value={criterionType}
            onChange={(v) => {
              setCriterionType(v);
              setCriterionParams({});
            }}
          />
          {renderCriterionParams()}
          <Button onClick={handleCreateCriterion} disabled={!criterionType}>
            Add Criterion
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
