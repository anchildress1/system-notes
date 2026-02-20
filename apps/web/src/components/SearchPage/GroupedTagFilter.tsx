'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRefinementList } from 'react-instantsearch';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from './SearchPage.module.css';

interface GroupedTagFilterProps {
  attributes: [string, string]; // [lvl0, lvl1]
  limit?: number;
}

export default function GroupedTagFilter({ attributes, limit = 50 }: GroupedTagFilterProps) {
  const [lvl0Attr, lvl1Attr] = attributes;

  // Fetch both levels
  const lvl0 = useRefinementList({ attribute: lvl0Attr, limit, sortBy: ['name:asc'] });
  const lvl1 = useRefinementList({ attribute: lvl1Attr, limit: limit * 2, sortBy: ['name:asc'] });

  // State for expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Refs for parent checkboxes to set indeterminate state
  const checkboxRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  // Track which parents we've synced to avoid infinite loops
  const syncedParents = useRef<Set<string>>(new Set());

  // Grouping Logic
  const groups = useMemo(() => {
    // Map of ParentLabel -> ChildItems
    const childrenByParent: Record<string, typeof lvl1.items> = {};

    lvl1.items.forEach((item) => {
      // item.value is "Parent > Child" or "Parent > Child > Grandchild"
      // We assume strict 2-level for this component as requested
      const parts = item.value.split(' > ');
      if (parts.length >= 2) {
        const parent = parts[0];
        if (!childrenByParent[parent]) {
          childrenByParent[parent] = [];
        }
        childrenByParent[parent].push(item);
      }
    });

    return {
      roots: lvl0.items,
      childrenByParent,
    };
  }, [lvl0.items, lvl1]);

  // Auto-select children when parent is refined via URL (run only once per parent)
  useEffect(() => {
    groups.roots.forEach((parentItem) => {
      if (parentItem.isRefined && !syncedParents.current.has(parentItem.value)) {
        const children = groups.childrenByParent[parentItem.label];
        if (children && children.length > 0) {
          // Check if all children are refined
          const allChildrenRefined = children.every((child) => child.isRefined);
          if (!allChildrenRefined) {
            // Mark as synced before refining to prevent loops
            syncedParents.current.add(parentItem.value);
            // Select any unrefined children
            children.forEach((child) => {
              if (!child.isRefined) {
                lvl1.refine(child.value);
              }
            });
          } else {
            // All children already refined, mark as synced
            syncedParents.current.add(parentItem.value);
          }
        }
      } else if (!parentItem.isRefined && syncedParents.current.has(parentItem.value)) {
        // Parent was deselected, remove from synced set
        syncedParents.current.delete(parentItem.value);
      }
    });
  }, [groups, lvl1]);

  // Set indeterminate state on parent checkboxes
  useEffect(() => {
    groups.roots.forEach((parentItem) => {
      const children = groups.childrenByParent[parentItem.label];
      if (children && children.length > 0) {
        const checkbox = checkboxRefs.current.get(parentItem.value);
        if (checkbox) {
          const refinedCount = children.filter((child) => child.isRefined).length;
          const hasPartialSelection = refinedCount > 0 && refinedCount < children.length;
          checkbox.indeterminate = hasPartialSelection;
        }
      }
    });
  }, [groups]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Handle parent refinement with auto-child selection
  const handleParentToggle = (parentItem: (typeof lvl0.items)[0], children?: typeof lvl1.items) => {
    // Toggle the parent
    lvl0.refine(parentItem.value);

    // If parent is being selected (currently not refined), select all children
    // If parent is being deselected (currently refined), deselect all children
    if (children && children.length > 0) {
      const shouldSelectChildren = !parentItem.isRefined;

      children.forEach((child) => {
        // Only refine if the child's state doesn't match what we want
        if (child.isRefined !== shouldSelectChildren) {
          lvl1.refine(child.value);
        }
      });
    }
  };

  if (lvl0.items.length === 0) {
    return null;
  }

  return (
    <div className={styles.refinementList}>
      {groups.roots.map((rootItem) => {
        const children = groups.childrenByParent[rootItem.label];
        const hasChildren = children && children.length > 0;
        const isExpanded = expandedGroups[rootItem.label] ?? false;

        // If it has children, render as Accordion Header
        if (hasChildren) {
          // Check if all children are refined to apply selected styling
          const allChildrenRefined = children.every((child) => child.isRefined);
          const isFullySelected = rootItem.isRefined && allChildrenRefined;

          return (
            <div
              key={rootItem.value}
              className={`${styles.refinementItem} ${isFullySelected ? styles.refinementItemSelected : ''}`}
            >
              {/* Header row: checkbox + label + expand chevron */}
              <div className={`${styles.refinementLabel} ${styles.tagGroupLabel}`}>
                <input
                  type="checkbox"
                  className={styles.refinementCheckbox}
                  checked={rootItem.isRefined}
                  onChange={() => handleParentToggle(rootItem, children)}
                  aria-label={`Filter by ${rootItem.label}`}
                  ref={(el) => {
                    if (el) {
                      checkboxRefs.current.set(rootItem.value, el);
                    } else {
                      checkboxRefs.current.delete(rootItem.value);
                    }
                  }}
                />
                <span
                  className={`${styles.refinementLabelText} ${styles.tagGroupLabelText}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleParentToggle(rootItem, children)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleParentToggle(rootItem, children);
                    }
                  }}
                >
                  {rootItem.label}
                </span>
                <span className={styles.refinementCount}>{rootItem.count}</span>
                <button
                  type="button"
                  className={styles.tagExpandButton}
                  onClick={() => toggleGroup(rootItem.label)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleGroup(rootItem.label);
                    }
                  }}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${rootItem.label} subtags`}
                >
                  {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>
              </div>

              {/* Children (Checkboxes) */}
              {isExpanded && (
                <div className={styles.tagChildren}>
                  {children.map((child) => (
                    <div
                      key={child.value}
                      className={`${styles.refinementItem} ${child.isRefined ? styles.refinementItemSelected : ''}`}
                    >
                      <label className={styles.refinementLabel}>
                        <input
                          type="checkbox"
                          className={styles.refinementCheckbox}
                          checked={child.isRefined}
                          onChange={() => lvl1.refine(child.value)}
                        />
                        <span className={styles.refinementLabelText}>
                          {child.label.split(' > ')[1]}
                        </span>
                        <span className={styles.refinementCount}>{child.count}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Standalone Item (No Children) - Render as Top-Level Checkbox
        return (
          <div
            key={rootItem.value}
            className={`${styles.refinementItem} ${rootItem.isRefined ? styles.refinementItemSelected : ''}`}
          >
            <label className={styles.refinementLabel}>
              <input
                type="checkbox"
                className={styles.refinementCheckbox}
                checked={rootItem.isRefined}
                onChange={() => lvl0.refine(rootItem.value)}
              />
              <span className={styles.refinementLabelText}>{rootItem.label}</span>
              <span className={styles.refinementCount}>{rootItem.count}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
