import React, { useState, useCallback, useMemo } from "react";
import {
	ReactFlow,
	Controls,
	Background,
	BackgroundVariant,
	addEdge,
	useNodesState,
	useEdgesState,
	Handle,
	Position,
} from "@xyflow/react";
import type { Node, Edge, Connection, NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
	TextField,
	Button,
	Chip,
	IconButton,
	Tooltip,
} from "@mui/material";
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	PlayArrow as PlayIcon,
	FilterAlt as FilterIcon,
} from "@mui/icons-material";
import { motion } from "motion/react";
import type { Applet, Service } from "../data/applets";

interface FlowBuilderProps {
	applet: Applet | null;
	services: Service[];
	onSave: (applet: Applet) => void;
	onCancel: () => void;
}

function TriggerNode({ data }: NodeProps): React.ReactElement {
	const service = data.service as Service;
	return (
		<div
			className="px-4 py-3 rounded-xl border-2 min-w-[180px]"
			style={{
				backgroundColor: `${service?.color}15`,
				borderColor: service?.color || "#666",
			}}
		>
			<Handle
				type="source"
				position={Position.Right}
				className="!bg-green-500"
			/>
			<div className="flex items-center gap-3">
				<div
					className="w-10 h-10 rounded-lg flex items-center justify-center"
					style={{ backgroundColor: `${service?.color}30` }}
				>
					<span className="material-icons" style={{ color: service?.color }}>
						{service?.icon || "bolt"}
					</span>
				</div>
				<div>
					<div className="text-xs text-gray-400 uppercase">Trigger</div>
					<div className="text-white font-medium">
						{service?.name || "Select"}
					</div>
				</div>
			</div>
		</div>
	);
}

function ActionNode({ data }: NodeProps): React.ReactElement {
	const service = data.service as Service;
	return (
		<div
			className="px-4 py-3 rounded-xl border-2 min-w-[180px]"
			style={{
				backgroundColor: `${service?.color}15`,
				borderColor: service?.color || "#666",
			}}
		>
			<Handle type="target" position={Position.Left} className="!bg-blue-500" />
			<div className="flex items-center gap-3">
				<div
					className="w-10 h-10 rounded-lg flex items-center justify-center"
					style={{ backgroundColor: `${service?.color}30` }}
				>
					<span className="material-icons" style={{ color: service?.color }}>
						{service?.icon || "play_arrow"}
					</span>
				</div>
				<div>
					<div className="text-xs text-gray-400 uppercase">Action</div>
					<div className="text-white font-medium">
						{service?.name || "Select"}
					</div>
				</div>
			</div>
		</div>
	);
}

function FilterNode({ data }: NodeProps): React.ReactElement {
	return (
		<div className="px-4 py-3 rounded-xl border-2 border-yellow-500 bg-yellow-500/10 min-w-[180px]">
			<Handle
				type="target"
				position={Position.Left}
				className="!bg-yellow-500"
			/>
			<Handle
				type="source"
				position={Position.Right}
				className="!bg-yellow-500"
			/>
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-500/20">
					<FilterIcon className="text-yellow-500" />
				</div>
				<div>
					<div className="text-xs text-gray-400 uppercase">Filter</div>
					<div className="text-white font-medium">
						{String(data.label || "Add condition")}
					</div>
				</div>
			</div>
		</div>
	);
}

const nodeTypes = {
	trigger: TriggerNode,
	action: ActionNode,
	filter: FilterNode,
};

function FlowBuilder({
	applet,
	services,
	onSave,
	onCancel,
}: FlowBuilderProps): React.ReactElement {
	const [name, setName] = useState(applet?.name || "");
	const [description, setDescription] = useState(applet?.description || "");
	const [tags, setTags] = useState<string[]>(applet?.tags || []);
	const [newTag, setNewTag] = useState("");

	const initialNodes: Node[] = useMemo(() => {
		if (applet) {
			const nodes: Node[] = [
				{
					id: "trigger-1",
					type: "trigger",
					position: { x: 100, y: 200 },
					data: { service: applet.trigger },
				},
			];

			applet.actions.forEach((action, i) => {
				nodes.push({
					id: `action-${i + 1}`,
					type: "action",
					position: { x: 400 + i * 250, y: 200 },
					data: { service: action },
				});
			});

			return nodes;
		}

		return [
			{
				id: "trigger-1",
				type: "trigger",
				position: { x: 100, y: 200 },
				data: { service: null },
			},
		];
	}, [applet]);

	const initialEdges: Edge[] = useMemo(() => {
		if (applet) {
			const edges: Edge[] = [];
			applet.actions.forEach((_, i) => {
				const sourceId = i === 0 ? "trigger-1" : `action-${i}`;
				const targetId = `action-${i + 1}`;
				edges.push({
					id: `e-${sourceId}-${targetId}`,
					source: sourceId,
					target: targetId,
					animated: true,
					style: { stroke: "#ff6b35" },
				});
			});
			return edges;
		}
		return [];
	}, [applet]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onConnect = useCallback(
		function (params: Connection): void {
			setEdges(function (eds) {
				return addEdge(
					{
						...params,
						animated: true,
						style: { stroke: "#ff6b35" },
					},
					eds,
				);
			});
		},
		[setEdges],
	);

	const addActionNode = useCallback(function (): void {
		const newNode: Node = {
			id: `action-${Date.now()}`,
			type: "action",
			position: { x: 400 + nodes.length * 50, y: 200 + nodes.length * 30 },
			data: { service: null },
		};
		setNodes(function (nds) {
			return [...nds, newNode];
		});
	}, [nodes.length, setNodes]);

	const addFilterNode = useCallback(function (): void {
		const newNode: Node = {
			id: `filter-${Date.now()}`,
			type: "filter",
			position: { x: 250, y: 300 },
			data: { label: "New Filter" },
		};
		setNodes(function (nds) {
			return [...nds, newNode];
		});
	}, [setNodes]);

	const updateNodeService = useCallback(
		function (nodeId: string, service: Service): void {
			setNodes(function (nds) {
				return nds.map(function (node) {
					if (node.id === nodeId) {
						return { ...node, data: { ...node.data, service } };
					}
					return node;
				});
			});
		},
		[setNodes],
	);

	const deleteNode = useCallback(
		function (nodeId: string): void {
			setNodes(function (nds) {
				return nds.filter(function (node) {
					return node.id !== nodeId;
				});
			});
			setEdges(function (eds) {
				return eds.filter(function (edge) {
					return edge.source !== nodeId && edge.target !== nodeId;
				});
			});
		},
		[setNodes, setEdges],
	);

	const addTag = useCallback(function (): void {
		if (newTag && !tags.includes(newTag.toLowerCase())) {
			setTags([...tags, newTag.toLowerCase()]);
			setNewTag("");
		}
	}, [newTag, tags]);

	const removeTag = useCallback(
		function (tagToRemove: string): void {
			setTags(tags.filter(function (tag) {
				return tag !== tagToRemove;
			}));
		},
		[tags],
	);

	const handleSave = useCallback(function (): void {
		const triggerNode = nodes.find(function (n) {
			return n.type === "trigger";
		});
		const actionNodes = nodes.filter(function (n) {
			return n.type === "action";
		});

		if (!triggerNode?.data.service || actionNodes.length === 0) {
			alert("Please add at least one trigger and one action");
			return;
		}

		const newApplet: Applet = {
			id: applet?.id || `applet-${Date.now()}`,
			name: name || "Untitled Applet",
			description: description || "No description",
			trigger: triggerNode.data.service as Service,
			actions: actionNodes.map(function (n) {
				return n.data.service as Service;
			}).filter(Boolean),
			tags,
			enabled: applet?.enabled ?? true,
			users: applet?.users || 0,
		};

		onSave(newApplet);
	}, [nodes, name, description, tags, applet, onSave]);

	return (
		<div className="flex h-[600px]">
			<div className="w-80 bg-[#0f0f1a] border-r border-white/10 p-4 overflow-y-auto">
				<div className="space-y-4">
					<TextField
						fullWidth
						label="Applet Name"
						value={name}
						onChange={function (e) {
							setName(e.target.value);
						}}
						size="small"
						sx={{
							"& .MuiInputLabel-root": { color: "gray" },
							"& .MuiOutlinedInput-root": {
								color: "white",
								"& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
								"&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
							},
						}}
					/>

					<TextField
						fullWidth
						label="Description"
						value={description}
						onChange={function (e) {
							setDescription(e.target.value);
						}}
						multiline
						rows={3}
						size="small"
						sx={{
							"& .MuiInputLabel-root": { color: "gray" },
							"& .MuiOutlinedInput-root": {
								color: "white",
								"& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
								"&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
							},
						}}
					/>

					<div>
						<label className="text-sm text-gray-400 mb-2 block">Tags</label>
						<div className="flex gap-2 mb-2">
							<TextField
								size="small"
								value={newTag}
								onChange={function (e) {
									setNewTag(e.target.value);
								}}
								placeholder="Add tag..."
								onKeyPress={function (e) {
									if (e.key === "Enter") {
										addTag();
									}
								}}
								sx={{
									flex: 1,
									"& .MuiOutlinedInput-root": {
										color: "white",
										"& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
									},
								}}
							/>
							<IconButton onClick={addTag} sx={{ color: "#ff6b35" }}>
								<AddIcon />
							</IconButton>
						</div>
						<div className="flex flex-wrap gap-1">
							{tags.map(function (tag) {
								return (
									<Chip
										key={tag}
										label={tag}
										onDelete={function () {
											removeTag(tag);
										}}
										size="small"
										sx={{
											backgroundColor: "rgba(255, 107, 53, 0.2)",
											color: "#ff6b35",
										}}
									/>
								);
							})}
						</div>
					</div>

					<div>
						<label className="text-sm text-gray-400 mb-2 block">
							Available Services
						</label>
						<div className="grid grid-cols-3 gap-2">
							{services.map(function (service) {
								return (
									<Tooltip key={service.id} title={service.name}>
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className="p-2 rounded-lg flex flex-col items-center gap-1 hover:bg-white/10 transition-colors"
											style={{ backgroundColor: `${service.color}10` }}
											onClick={function () {
												const nodeToUpdate = nodes.find(function (n) {
													return !n.data.service;
												});
												if (nodeToUpdate) {
													updateNodeService(nodeToUpdate.id, service);
												}
											}}
										>
											<span
												className="material-icons text-xl"
												style={{ color: service.color }}
											>
												{service.icon}
											</span>
											<span className="text-xs text-gray-400 truncate w-full text-center">
												{service.name}
											</span>
										</motion.button>
									</Tooltip>
								);
							})}
						</div>
					</div>

					<div className="flex gap-2 pt-4 border-t border-white/10">
						<Button
							variant="outlined"
							startIcon={<PlayIcon />}
							onClick={addActionNode}
							sx={{
								borderColor: "rgba(255,255,255,0.2)",
								color: "white",
								"&:hover": { borderColor: "#ff6b35" },
							}}
						>
							Add Action
						</Button>
						<Button
							variant="outlined"
							startIcon={<FilterIcon />}
							onClick={addFilterNode}
							sx={{
								borderColor: "rgba(255,255,255,0.2)",
								color: "white",
								"&:hover": { borderColor: "#fbbf24" },
							}}
						>
							Add Filter
						</Button>
					</div>
				</div>
			</div>

			<div className="flex-1 relative">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					nodeTypes={nodeTypes}
					fitView
					style={{ background: "#1a1a2e" }}
				>
					<Background
						variant={BackgroundVariant.Dots}
						gap={20}
						size={1}
						color="rgba(255,255,255,0.1)"
					/>
					<Controls />
				</ReactFlow>

				<div className="absolute top-4 right-4 flex gap-2">
					{nodes
						.filter(function (n) {
							return n.type !== "trigger";
						})
						.map(function (node) {
							return (
								<Tooltip key={node.id} title="Delete node">
									<IconButton
										onClick={function () {
											deleteNode(node.id);
										}}
										sx={{
											backgroundColor: "rgba(239, 68, 68, 0.2)",
											color: "#ef4444",
											"&:hover": { backgroundColor: "rgba(239, 68, 68, 0.3)" },
										}}
									>
										<DeleteIcon />
									</IconButton>
								</Tooltip>
							);
						})}
				</div>
			</div>

			<div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0f0f1a]/90 backdrop-blur border-t border-white/10 flex justify-end gap-3">
				<Button
					variant="outlined"
					onClick={onCancel}
					sx={{
						borderColor: "rgba(255,255,255,0.2)",
						color: "white",
						"&:hover": { borderColor: "rgba(255,255,255,0.4)" },
					}}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleSave}
					sx={{
						background: "linear-gradient(135deg, #ff6b35, #f7931e)",
						"&:hover": {
							background: "linear-gradient(135deg, #ff7b45, #f9a32e)",
						},
					}}
				>
					Save Applet
				</Button>
			</div>
		</div>
	);
}

export default FlowBuilder;
