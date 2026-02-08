import { Handle, Position } from 'reactflow';
import { Database, Columns } from 'lucide-react';

interface Column {
  name: string;
  type: string;
}

interface TableNodeData {
  label: string;
  columns: Column[];
}

export default function TableNode({ data }: { data: TableNodeData }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl min-w-[200px] overflow-hidden">
      <div className="bg-indigo-600/20 border-b border-zinc-700 p-2 flex items-center gap-2">
        <Database className="w-4 h-4 text-indigo-400" />
        <span className="font-bold text-sm text-zinc-100">{data.label}</span>
      </div>
      
      <div className="p-2 space-y-1">
        {data.columns.map((col: Column) => (
          <div key={col.name} className="flex items-center justify-between text-xs group">
            <div className="flex items-center gap-2">
                <Columns className="w-3 h-3 text-zinc-600" />
                <span className="text-zinc-300">{col.name}</span>
            </div>
            <span className="text-zinc-500 font-mono text-[10px]">{col.type}</span>
          </div>
        ))}
      </div>

      <Handle type="target" position={Position.Left} className="!bg-zinc-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-zinc-500 !w-2 !h-2" />
    </div>
  );
}
