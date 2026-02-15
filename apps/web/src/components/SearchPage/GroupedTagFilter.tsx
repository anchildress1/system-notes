'use client';

import React, { useState, useMemo } from 'react';
import { useRefinementList } from 'react-instantsearch';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
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
          return (
            <div key={rootItem.value} className={styles.refinementItem}>
              {/* Header row: checkbox + label + expand chevron */}
              <div className={`${styles.refinementLabel} ${styles.tagGroupLabel}`}>
                <input
                  type="checkbox"
                  className={styles.refinementCheckbox}
                  checked={rootItem.isRefined}
                  onChange={() => handleParentToggle(rootItem, children)}
                  aria-label={`Filter by ${rootItem.label}`}
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
                  {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                </button>
              </div>

              {/* Children (Checkboxes) */}
              {isExpanded && (
                <div className={styles.tagChildren}>
                  {children.map((child) => (
                    <label key={child.value} className={styles.refinementLabel}>
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
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Standalone Item (No Children) - Render as Top-Level Checkbox
        return (
          <div key={rootItem.value} className={styles.refinementItem}>
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
