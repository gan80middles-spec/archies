
import { useState, useCallback } from 'react';
import { EditorBlockNode, BlockType, TextBlock, ListBlock } from '../types';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// Helper: Create a sibling node based on current node type
export const createSiblingNode = (current: EditorBlockNode): EditorBlockNode => {
  if (current.type === 'li') {
    return {
      id: generateId(),
      type: 'li',
      content: '',
      children: [],
      listStyle: (current as ListBlock).listStyle,
      checked: false
    };
  }
  
  let newType: BlockType = 'paragraph';
  // Headers stay headers, others revert to paragraph
  if (current.type === 'h1' || current.type === 'h2' || current.type === 'h3') {
      newType = current.type;
  }

  return { 
    id: generateId(), 
    type: newType as any, // Cast to avoid TS issues with discriminated union creation
    content: '', 
    children: [] 
  } as EditorBlockNode;
};

export function useOutlineTree(initialState: EditorBlockNode[]) {
  const [rootBlocks, setRootBlocks] = useState<EditorBlockNode[]>(initialState);

  // --- CRUD Operations ---

  const updateNode = useCallback((id: string, updates: Partial<EditorBlockNode>) => {
    setRootBlocks(prev => {
        const updateRecursive = (nodes: EditorBlockNode[]): EditorBlockNode[] => {
            return nodes.map(node => {
                if (node.id === id) {
                    // Spread updates carefully to maintain union validity if needed
                    return { ...node, ...updates } as EditorBlockNode;
                }
                if (node.children.length > 0) {
                    return { ...node, children: updateRecursive(node.children) };
                }
                return node;
            });
        };
        return updateRecursive(prev);
    });
  }, []);

  const addSibling = useCallback((targetId: string, newNode: EditorBlockNode, direction: 'before' | 'after' = 'after') => {
    setRootBlocks(prev => {
        const addRecursive = (nodes: EditorBlockNode[]): EditorBlockNode[] => {
            const index = nodes.findIndex(n => n.id === targetId);
            if (index !== -1) {
                const newNodes = [...nodes];
                const insertIndex = direction === 'after' ? index + 1 : index;
                newNodes.splice(insertIndex, 0, newNode);
                return newNodes;
            }
            return nodes.map(node => {
                if (node.children.length > 0) {
                    return { ...node, children: addRecursive(node.children) };
                }
                return node;
            });
        };
        return addRecursive(prev);
    });
  }, []);

  const addChild = useCallback((parentId: string, type: BlockType, extra?: Partial<EditorBlockNode>) => {
    const newNode: EditorBlockNode = {
        id: generateId(),
        type: type as any,
        content: '',
        children: [],
        ...extra
    } as EditorBlockNode;

    setRootBlocks(prev => {
        const addRecursive = (nodes: EditorBlockNode[]): EditorBlockNode[] => {
            return nodes.map(node => {
                if (node.id === parentId) {
                    return { ...node, children: [...node.children, newNode], isCollapsed: false };
                }
                if (node.children.length > 0) {
                    return { ...node, children: addRecursive(node.children) };
                }
                return node;
            });
        };
        return addRecursive(prev);
    });
  }, []);

  const removeNode = useCallback((id: string) => {
    setRootBlocks(prev => {
        const removeRecursive = (nodes: EditorBlockNode[]): EditorBlockNode[] => {
            return nodes
                .filter(node => node.id !== id)
                .map(node => ({
                    ...node,
                    children: removeRecursive(node.children)
                }));
        };
        
        const newRoots = removeRecursive(prev);
        
        // Ensure root is never empty. If all blocks are deleted, insert a default H1.
        if (newRoots.length === 0) {
             return [{ id: generateId(), type: 'h1', content: '', children: [] }] as EditorBlockNode[];
        }
        
        return newRoots;
    });
  }, []);

  // --- Serialization ---

  const flattenBlocksWithDepth = useCallback((nodes: EditorBlockNode[], depth = 0): { node: EditorBlockNode, depth: number }[] => {
    const result: { node: EditorBlockNode, depth: number }[] = [];
    nodes.forEach(node => {
        result.push({ node, depth });
        if (node.children && node.children.length > 0) {
            result.push(...flattenBlocksWithDepth(node.children, depth + 1));
        }
    });
    return result;
  }, []);

  const generateMarkdownContent = useCallback((): string => {
    const flatBlocks = flattenBlocksWithDepth(rootBlocks);
    
    return flatBlocks.map(({ node, depth }) => {
      const content = node.content || '';
      const indent = '  '.repeat(Math.max(0, depth - 1));
      
      switch (node.type) {
        case 'h1': return `# ${content}`;
        case 'h2': return `## ${content}`;
        case 'h3': return `### ${content}`;
        case 'quote': return `> ${content}`;
        case 'code': return `\`\`\`\n${content}\n\`\`\``;
        case 'hr': return `---`;
        case 'image': return `![${node.alt || ''}](${node.src || ''})`;
        case 'li':
            const listNode = node as ListBlock;
            const prefix = listNode.listStyle === 'number' ? '1.' : 
                           listNode.listStyle === 'task' ? `- [${listNode.checked ? 'x' : ' '}]` : 
                           '-';
            return `${indent}${prefix} ${content}`;
        case 'paragraph':
        default: return content;
      }
    }).join('\n\n');
  }, [rootBlocks, flattenBlocksWithDepth]);

  return {
    rootBlocks,
    setRootBlocks,
    updateNode,
    addSibling,
    addChild,
    removeNode,
    generateMarkdownContent
  };
}
