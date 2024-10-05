import { TreeData } from "@/assets/treeData";
import clsx from "clsx";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import MailIcon from "@mui/icons-material/Mail";
import FolderIcon from "@mui/icons-material/Folder";
import MapIcon from "@mui/icons-material/Map";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import { SvgIconProps } from "@mui/material/SvgIcon";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import {
  TreeItem2Content,
  TreeItem2IconContainer,
  TreeItem2Root,
  TreeItem2GroupTransition,
} from "@mui/x-tree-view/TreeItem2";
import {
  useTreeItem2,
  UseTreeItem2Parameters,
} from "@mui/x-tree-view/useTreeItem2";
import { TreeItem2Provider } from "@mui/x-tree-view/TreeItem2Provider";
import { TreeItem2Icon } from "@mui/x-tree-view/TreeItem2Icon";
import React, { useState, useMemo, useCallback } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CloseIcon from "@mui/icons-material/Close";
import Chip from "@mui/material/Chip";

// CustomTreeItem component
const CustomTreeItemRoot = styled(TreeItem2Root)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const CustomTreeItemContent = styled(TreeItem2Content)(({ theme }) => ({
  marginBottom: theme.spacing(0.3),
  color: theme.palette.text.secondary,
  borderRadius: theme.spacing(2),
  paddingRight: theme.spacing(1),
  fontWeight: theme.typography.fontWeightMedium,
  "&.expanded": {
    fontWeight: theme.typography.fontWeightRegular,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "&.focused, &.selected, &.selected.focused": {
    backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
    color: "var(--tree-view-color)",
  },
}));

const CustomTreeItemIconContainer = styled(TreeItem2IconContainer)(
  ({ theme }) => ({
    marginRight: theme.spacing(1),
  })
);

const CustomTreeItemGroupTransition = styled(TreeItem2GroupTransition)(
  ({ theme }) => ({
    marginLeft: 0,
    [`& .content`]: {
      paddingLeft: theme.spacing(2),
    },
  })
);

const CustomTreeItem = React.memo(
  React.forwardRef(function CustomTreeItem(
    props: UseTreeItem2Parameters & {
      labelIcon: React.ElementType<SvgIconProps>;
    },
    ref: React.Ref<HTMLLIElement>
  ) {
    const { id, itemId, label, children, labelIcon: LabelIcon } = props;
    const {
      getRootProps,
      getContentProps,
      getIconContainerProps,
      getLabelProps,
      getGroupTransitionProps,
      status,
    } = useTreeItem2({ id, itemId, children, label, rootRef: ref });

    return (
      <TreeItem2Provider itemId={itemId}>
        <CustomTreeItemRoot {...getRootProps()}>
          <CustomTreeItemContent
            {...getContentProps({
              className: clsx("content", {
                expanded: status.expanded,
                selected: status.selected,
                focused: status.focused,
              }),
            })}
          >
            <CustomTreeItemIconContainer {...getIconContainerProps()}>
              <TreeItem2Icon status={status} />
            </CustomTreeItemIconContainer>
            <Box
              sx={{
                display: "flex",
                flexGrow: 1,
                alignItems: "center",
                p: 0.5,
                pr: 0,
              }}
            >
              <Box component={LabelIcon} sx={{ mr: 1 }} />
              <Typography
                {...getLabelProps({ variant: "body2", sx: { flexGrow: 1 } })}
              >
                {label}
              </Typography>
            </Box>
          </CustomTreeItemContent>
          {children && (
            <CustomTreeItemGroupTransition {...getGroupTransitionProps()} />
          )}
        </CustomTreeItemRoot>
      </TreeItem2Provider>
    );
  })
);

// Recursive function to render tree items
const renderTreeItems = (nodes: any, selectedItems: string[]) => {
  return nodes.map((node: any) => (
    <CustomTreeItem
      key={node.id}
      itemId={node.id}
      label={node.name}
      labelIcon={getIconForLevel(node.id)}
    >
      {node.children ? renderTreeItems(node.children, selectedItems) : null}
    </CustomTreeItem>
  ));
};

// Helper function to get appropriate icon for node levels
const getIconForLevel = (nodeId: string) => {
  if (nodeId.startsWith("dat")) {
    return MailIcon;
  } else if (nodeId.startsWith("oda")) {
    return FolderIcon;
  } else if (nodeId.startsWith("reg")) {
    return MapIcon;
  } else if (nodeId.startsWith("pop")) {
    return GroupIcon;
  } else {
    return PersonIcon;
  }
};

// Helper function to determine if a node is terminal (has no children)
const isTerminalNode = (nodeId: string, treeData: any[]) => {
  const findNodeById = (id: string, nodes: any[]): boolean => {
    for (const node of nodes) {
      if (node.id === id) {
        return !node.children; // Return true if no children (terminal node)
      }
      if (node.children) {
        const foundInChild = findNodeById(id, node.children);
        if (foundInChild) return foundInChild;
      }
    }
    return false;
  };
  return findNodeById(nodeId, treeData);
};

export function GmailTreeView({
  selectedItems,
  onSelectedItemsChange,
}: {
  selectedItems: string[];
  onSelectedItemsChange: (selectedItems: string[]) => void;
}) {
  const handleSelectionChange = useCallback(
    (newSelectedItems: string[]) => {
      // Filter the selection to ensure only terminal nodes are selected
      const validSelections = newSelectedItems.filter((id) =>
        isTerminalNode(id, TreeData)
      );
      // Merge new selections with previous ones
      const newSelections = [
        ...new Set([...selectedItems, ...validSelections]),
      ];
      onSelectedItemsChange(newSelections);
    },
    [onSelectedItemsChange, selectedItems]
  );

  const memoizedTreeItems = useMemo(
    () => renderTreeItems(TreeData, selectedItems),
    [selectedItems]
  );

  return (
    <SimpleTreeView
      aria-label="gmail"
      defaultExpandedItems={[]}
      selectedItems={selectedItems}
      onSelectedItemsChange={(_, newSelectedItems) =>
        handleSelectionChange(newSelectedItems)
      }
      multiSelect
      slots={{
        expandIcon: ArrowRightIcon,
        collapseIcon: ArrowDropDownIcon,
        endIcon: () => <div style={{ width: 24 }} />,
      }}
      sx={{ flexGrow: 1, maxWidth: 400 }}
    >
      {memoizedTreeItems}
    </SimpleTreeView>
  );
}

// Helper function to extract terminal nodes
const getTerminalNodes = (nodes: any): { id: string; name: string }[] => {
  let terminalNodes: { id: string; name: string }[] = [];
  nodes.forEach((node: any) => {
    if (!node.children) {
      terminalNodes.push({ id: node.id, name: node.name });
    } else {
      terminalNodes = [...terminalNodes, ...getTerminalNodes(node.children)];
    }
  });
  return terminalNodes;
};

export function GmailTreeViewWithText({
  selectedItems,
  onSelectedItemsChange,
}: {
  selectedItems: string[];
  onSelectedItemsChange: (selectedItems: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState(""); // State for input text
  const terminalNodes = useMemo(() => getTerminalNodes(TreeData), []); // Memoize terminal nodes

  // Memoize filtered options to prevent excessive recalculations
  const filteredOptions = useMemo(
    () => (inputValue.length >= 4 ? terminalNodes : []),
    [inputValue, terminalNodes]
  );

  const handleAutocompleteChange = useCallback(
    (event: any, newSelected: { id: string; name: string }[]) => {
      const selectedIds = newSelected.map((node) => node.id);
      const newSelections = [...new Set([...selectedItems, ...selectedIds])]; // Merge with current selections
      onSelectedItemsChange(newSelections); // Add selected IDs to existing selectedItems
      setInputValue(""); // Clear the input field
    },
    [onSelectedItemsChange, selectedItems]
  );

  const handleInputChange = useCallback(
    (event: any, newInputValue: string, reason: string) => {
      // Ignore resets triggered by MUI, only handle normal changes
      if (reason !== "reset") {
        setInputValue(newInputValue);
      }
    },
    []
  );

  const handleDelete = useCallback(
    (nodeId: string) => {
      const newSelectedItems = selectedItems.filter((id) => id !== nodeId);
      onSelectedItemsChange(newSelectedItems); // Update selected items without the deleted one
    },
    [selectedItems, onSelectedItemsChange]
  );

  const handleTreeSelectionChange = useCallback(
    (newSelectedItems: string[]) => {
      // Filter the selection to ensure only terminal nodes are selected
      const validSelections = newSelectedItems.filter((id) =>
        isTerminalNode(id, TreeData)
      );
      const newSelections = [
        ...new Set([...selectedItems, ...validSelections]),
      ];
      onSelectedItemsChange(newSelections); // Add valid tree selections to existing items
    },
    [onSelectedItemsChange, selectedItems]
  );

  const memoizedTreeItems = useMemo(
    () => renderTreeItems(TreeData, selectedItems),
    [selectedItems]
  );

  return (
    <Box>
      <Autocomplete
        multiple
        options={filteredOptions} // Only show options if input length >= 4
        getOptionLabel={(option) => option.name}
        value={terminalNodes.filter((node) => selectedItems.includes(node.id))} // Sync selected items with Autocomplete
        onChange={handleAutocompleteChange}
        inputValue={inputValue}
        onInputChange={handleInputChange} // Properly handle input change
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={option.name}
              {...getTagProps({ index })}
              onDelete={() => handleDelete(option.id)} // Handle deletion from Autocomplete
              deleteIcon={<CloseIcon />}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Search as individual_dataset"
            helperText={
              inputValue.length < 4
                ? "Type at least 4 characters to search"
                : ""
            }
          />
        )}
      />
      {/* Render tree view */}
      <SimpleTreeView
        aria-label="gmail"
        defaultExpandedItems={[]}
        selectedItems={selectedItems} // Sync selected items with tree
        onSelectedItemsChange={(_, newSelectedItems) =>
          handleTreeSelectionChange(newSelectedItems)
        }
        multiSelect
        slots={{
          expandIcon: ArrowRightIcon,
          collapseIcon: ArrowDropDownIcon,
          endIcon: () => <div style={{ width: 24 }} />,
        }}
        sx={{ flexGrow: 1, maxWidth: 400 }}
      >
        {memoizedTreeItems}
      </SimpleTreeView>
    </Box>
  );
}
