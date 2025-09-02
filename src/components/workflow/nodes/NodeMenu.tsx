import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Copy, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { Node } from '@xyflow/react';

interface NodeMenuProps {
  nodeId: string;
  nodeData: any;
  nodePosition: { x: number; y: number };
}

export default function NodeMenu({ nodeId, nodeData, nodePosition }: NodeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteNode, addNode } = useWorkflowStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(nodeId);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add new node with same data but offset position
    addNode({
      position: {
        x: nodePosition.x + 50,
        y: nodePosition.y + 50,
      },
      type: nodeData.type,
      data: {
        ...nodeData,
        label: `${nodeData.label} (Copy)`,
      },
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-3 w-3" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-3 w-3" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}