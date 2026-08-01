"use client";

import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TreeViewElement = {
  id: string;
  name: string;
  type?: "file" | "folder";
  isSelectable?: boolean;
  children?: TreeViewElement[];
};

type TreeSortMode =
  | "default"
  | "none"
  | ((a: TreeViewElement, b: TreeViewElement) => number);

type TreeAction = (element: TreeViewElement) => void;

type TreeViewProps = {
  elements?: TreeViewElement[];
  initialExpandedItems?: string[];
  initialSelectedId?: string;
  selectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  onCreate?: TreeAction;
  onRename?: TreeAction;
  onDelete?: TreeAction;
  getCreateLabel?: (element: TreeViewElement) => string;
  getRenameLabel?: (element: TreeViewElement) => string;
  getDeleteLabel?: (element: TreeViewElement) => string;
  indicator?: boolean;
  sort?: TreeSortMode;
} & Omit<React.ComponentPropsWithoutRef<"div">, "onSelect">;

const treeCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

function isFolderElement(element: TreeViewElement) {
  if (element.type) return element.type === "folder";
  return Array.isArray(element.children);
}

function getTreeComparator(sort: TreeSortMode) {
  if (sort === "none") return undefined;
  if (typeof sort === "function") return sort;

  return (a: TreeViewElement, b: TreeViewElement) => {
    const aIsFolder = isFolderElement(a);
    const bIsFolder = isFolderElement(b);
    if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
    return treeCollator.compare(a.name, b.name);
  };
}

function sortTreeElements(
  elements: TreeViewElement[],
  sort: TreeSortMode,
): TreeViewElement[] {
  const comparator = getTreeComparator(sort);
  const nextElements = elements.map((element) => ({
    ...element,
    children: element.children
      ? sortTreeElements(element.children, sort)
      : undefined,
  }));
  return comparator ? nextElements.sort(comparator) : nextElements;
}

function getExpandedPath(
  elements: TreeViewElement[],
  selectedId: string,
  ancestors: string[] = [],
): string[] {
  for (const element of elements) {
    if (element.id === selectedId) return ancestors;
    if (element.children) {
      const path = getExpandedPath(element.children, selectedId, [
        ...ancestors,
        element.id,
      ]);
      if (path.length > 0) return path;
    }
  }
  return [];
}

function TreeActionButton({
  label,
  onClick,
  icon: Icon,
  destructive = false,
}: {
  label: string;
  onClick: () => void;
  icon: typeof PlusIcon;
  destructive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            size="icon-xs"
            type="button"
            variant={destructive ? "destructive" : "ghost"}
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

type TreeNodeProps = {
  element: TreeViewElement;
  depth: number;
  expandedItems: Set<string>;
  selectedId?: string;
  indicator: boolean;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onCreate?: TreeAction;
  onRename?: TreeAction;
  onDelete?: TreeAction;
  getCreateLabel: (element: TreeViewElement) => string;
  getRenameLabel: (element: TreeViewElement) => string;
  getDeleteLabel: (element: TreeViewElement) => string;
};

function TreeNode({
  element,
  depth,
  expandedItems,
  selectedId,
  indicator,
  onExpand,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  getCreateLabel,
  getRenameLabel,
  getDeleteLabel,
}: TreeNodeProps) {
  const isFolder = isFolderElement(element);
  const isExpanded = expandedItems.has(element.id);
  const isSelected = selectedId === element.id;
  const isSelectable = element.isSelectable ?? true;
  const Icon = isFolder ? (isExpanded ? FolderOpenIcon : FolderIcon) : FileIcon;

  return (
    <div className="relative">
      <div
        className={cn(
          "group/tree-row relative flex min-w-0 items-center rounded-md",
          isSelected && "bg-muted",
        )}
      >
        <Button
          aria-current={isSelected ? "page" : undefined}
          aria-expanded={isFolder ? isExpanded : undefined}
          className="min-w-0 flex-1 justify-start px-1.5 aria-expanded:bg-transparent dark:aria-expanded:bg-transparent"
          disabled={!isSelectable}
          size="sm"
          type="button"
          variant="ghost"
          onClick={() => {
            onSelect(element.id);
            if (isFolder) onExpand(element.id);
          }}
        >
          <Icon data-icon="inline-start" />
          <span className="min-w-0 flex-1 truncate text-left" title={element.name}>
            {element.name}
          </span>
        </Button>

        <div className="pointer-events-none flex shrink-0 items-center gap-0.5 pr-1 opacity-0 transition-opacity duration-150 group-focus-within/tree-row:pointer-events-auto group-focus-within/tree-row:opacity-100 group-hover/tree-row:pointer-events-auto group-hover/tree-row:opacity-100">
          {onCreate ? (
            <TreeActionButton
              icon={PlusIcon}
              label={getCreateLabel(element)}
              onClick={() => onCreate(element)}
            />
          ) : null}
          {onRename ? (
            <TreeActionButton
              icon={PencilSimpleIcon}
              label={getRenameLabel(element)}
              onClick={() => onRename(element)}
            />
          ) : null}
          {onDelete ? (
            <TreeActionButton
              destructive
              icon={TrashIcon}
              label={getDeleteLabel(element)}
              onClick={() => onDelete(element)}
            />
          ) : null}
        </div>
      </div>

      {isFolder && isExpanded && element.children ? (
        <div
          className={cn(
            "relative ml-4 flex flex-col gap-0.5 py-0.5 pl-2",
            indicator && "before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border",
          )}
        >
          {element.children.map((child) => (
            <TreeNode
              key={child.id}
              element={child}
              depth={depth + 1}
              expandedItems={expandedItems}
              getCreateLabel={getCreateLabel}
              getDeleteLabel={getDeleteLabel}
              getRenameLabel={getRenameLabel}
              indicator={indicator}
              onCreate={onCreate}
              onDelete={onDelete}
              onExpand={onExpand}
              onRename={onRename}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const Tree = forwardRef<HTMLDivElement, TreeViewProps>(
  (
    {
      className,
      elements = [],
      initialExpandedItems = [],
      initialSelectedId,
      selectedId: controlledSelectedId,
      onSelectedIdChange,
      onCreate,
      onRename,
      onDelete,
      getCreateLabel = () => "Create",
      getRenameLabel = () => "Rename",
      getDeleteLabel = () => "Delete",
      indicator = true,
      sort = "default",
      ...props
    },
    ref,
  ) => {
    const [internalSelectedId, setInternalSelectedId] = useState(
      initialSelectedId,
    );
    const selectedId = controlledSelectedId ?? internalSelectedId;
    const [expandedItems, setExpandedItems] = useState(
      () => new Set(initialExpandedItems),
    );
    const sortedElements = useMemo(
      () => sortTreeElements(elements, sort),
      [elements, sort],
    );

    useEffect(() => {
      if (!selectedId) return;
      const path = getExpandedPath(sortedElements, selectedId);
      if (path.length === 0) return;
      setExpandedItems((current) => new Set([...current, ...path]));
    }, [selectedId, sortedElements]);

    const handleExpand = useCallback((id: string) => {
      setExpandedItems((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, []);

    const handleSelect = useCallback(
      (id: string) => {
        setInternalSelectedId(id);
        onSelectedIdChange?.(id);
      },
      [onSelectedIdChange],
    );

    return (
      <TooltipProvider>
        <div ref={ref} className={cn("size-full", className)} {...props}>
          <ScrollArea className="h-full" scrollbarVisibility="hidden">
            <div className="flex min-w-0 flex-col gap-0.5 py-1">
              {sortedElements.map((element) => (
                <TreeNode
                  key={element.id}
                  element={element}
                  depth={0}
                  expandedItems={expandedItems}
                  getCreateLabel={getCreateLabel}
                  getDeleteLabel={getDeleteLabel}
                  getRenameLabel={getRenameLabel}
                  indicator={indicator}
                  onCreate={onCreate}
                  onDelete={onDelete}
                  onExpand={handleExpand}
                  onRename={onRename}
                  onSelect={handleSelect}
                  selectedId={selectedId}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </TooltipProvider>
    );
  },
);

Tree.displayName = "Tree";

type FolderProps = React.ComponentPropsWithoutRef<"div"> & {
  element: string;
  value: string;
};

const Folder = forwardRef<HTMLDivElement, FolderProps>(
  ({ element, children, ...props }, ref) => (
    <div ref={ref} {...props}>
      <span>{element}</span>
      {children}
    </div>
  ),
);

Folder.displayName = "Folder";

type FileProps = React.ComponentPropsWithoutRef<typeof Button> & {
  value: string;
  handleSelect?: (id: string) => void;
  fileIcon?: React.ReactNode;
};

const File = forwardRef<HTMLButtonElement, FileProps>(
  ({ value, handleSelect, fileIcon, children, onClick, ...props }, ref) => (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      onClick={(event) => {
        handleSelect?.(value);
        onClick?.(event);
      }}
      {...props}
    >
      {fileIcon ?? <FileIcon data-icon="inline-start" />}
      {children}
    </Button>
  ),
);

File.displayName = "File";

type CollapseButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  elements: TreeViewElement[];
  expandAll?: boolean;
};

const CollapseButton = forwardRef<HTMLButtonElement, CollapseButtonProps>(
  ({ elements: _elements, expandAll: _expandAll, children, ...props }, ref) => (
    <Button ref={ref} type="button" variant="ghost" {...props}>
      {children}
      <span className="sr-only">Toggle tree</span>
    </Button>
  ),
);

CollapseButton.displayName = "CollapseButton";

export { CollapseButton, File, Folder, Tree, type TreeViewElement };
export type { TreeSortMode };
