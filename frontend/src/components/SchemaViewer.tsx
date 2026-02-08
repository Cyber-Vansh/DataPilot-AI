import { useState, useEffect } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  MarkerType,
  Node,
  Edge,
  Position,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { X, Loader2 } from 'lucide-react';
import TableNode from './TableNode';

interface SchemaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  token: string | null;
}

interface Column {
  name: string;
  type: string;
}

interface TableSchema {
  name: string;
  columns: Column[];
}

interface Relationship {
  from: string;
  to: string;
  cols: string[];
  refCols: string[];
}

interface SchemaData {
  tables: TableSchema[];
  relationships?: Relationship[];
}

const nodeTypes = {
  table: TableNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220;
  const nodeHeight = 200;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
    node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

export default function SchemaViewer({ isOpen, onClose, projectId, token }: SchemaViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchema = async () => {
        setLoading(true);
        setError(null);
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
          const res = await fetch(`${apiUrl}/api/projects/${projectId}/schema`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error('Failed to fetch schema');
          
          const data: SchemaData = await res.json();
          
          const initialNodes: Node[] = data.tables.map((table: TableSchema) => ({
            id: table.name,
            type: 'table',
            data: { label: table.name, columns: table.columns },
            position: { x: 0, y: 0 }
          }));

          const initialEdges: Edge[] = [];
          if (data.relationships) {
             data.relationships.forEach((rel: Relationship, index: number) => {
                initialEdges.push({
                    id: `e${index}-${rel.from}-${rel.to}`,
                    source: rel.from,
                    target: rel.to,
                    type: ConnectionLineType.SmoothStep,
                    animated: true,
                    style: { stroke: '#6366f1' },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#6366f1',
                    },
                });
             });
          }

          const layouted = getLayoutedElements(initialNodes, initialEdges);
          setNodes(layouted.nodes);
          setEdges(layouted.edges);

        } catch (err) {
          console.error(err);
          setError('Failed to load database schema. Please try again.');
        } finally {
          setLoading(false);
        }
      };

    if (isOpen && projectId && token) {
      fetchSchema();
    } else {
        setNodes([]);
        setEdges([]);
    }
  }, [isOpen, projectId, token, setNodes, setEdges]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
                onClick={onClose}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors shadow-lg border border-zinc-700"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="absolute top-4 left-4 z-10 bg-zinc-900/80 backdrop-blur border border-zinc-700 p-3 rounded-lg shadow-lg">
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
                 <Loader2 className={loading ? "animate-spin text-indigo-500" : "hidden"} size={18} />
                 Database Schema
             </h2>
             <p className="text-xs text-zinc-400">Interactive Entity Relationship Diagram</p>
        </div>

        <div className="flex-1 w-full h-full bg-zinc-950">
          {loading && nodes.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
             </div>
          ) : error ? (
             <div className="absolute inset-0 flex items-center justify-center text-red-400">
                 {error}
             </div>
          ) : (
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-zinc-950"
            >
                <Background color="#333" gap={16} />
                <Controls className="!bg-zinc-800 !border-zinc-700 !fill-white" />
                <MiniMap 
                    nodeStrokeColor={() => '#6366f1'}
                    nodeColor={() => '#1e1b4b'}
                    maskColor="rgba(0, 0, 0, 0.7)"
                    className="!bg-zinc-900 !border-zinc-800"
                />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
