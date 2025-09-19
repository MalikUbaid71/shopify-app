"use client";

import React, { useEffect, useState } from "react";
import { Card, Badge } from "@shopify/polaris";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";

/**
 * NOTE:
 * - Replace the default `storeHandle` value with your store handle (e.g. "testing-store3322"),
 *   or pass `storeHandle` as a prop when rendering <CollectionTree storeHandle="..." />.
 * - If you haven't installed lucide-react: `npm install lucide-react`
 */

const DEFAULT_STORE_HANDLE = "by39tk-uv";

function TreeNode({ node, level = 0, storeHandle }) {
    const [open, setOpen] = useState(true);
    const numericId = node.id.split("/").pop();
    const adminUrl = `https://admin.shopify.com/store/${storeHandle}/collections/${numericId}`;

    return (
        <li
            style={{
                listStyle: "none",
                margin: "6px 0",
                paddingLeft: `${level * 16}px`,
                display: "block",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 10px",
                    borderRadius: 8,
                    cursor: "default",
                    transition: "background 0.15s",
                }}
            >
                <button
                    onClick={() => setOpen((s) => !s)}
                    aria-label={open ? "Collapse" : "Expand"}
                    style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        cursor: node.children?.length ? "pointer" : "default",
                    }}
                >
                    {node.children?.length ? (
                        open ? (
                            <ChevronDown size={16} />
                        ) : (
                            <ChevronRight size={16} />
                        )
                    ) : (
                        <span style={{ width: 16 }} />
                    )}
                </button>

                {node.children?.length ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <FolderOpen size={16} />
                    </span>
                ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Folder size={16} />
                    </span>
                )}

                <a
                    href={adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: "#0b6cbf",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: 14,
                    }}
                >
                    {node.title}
                </a>

                <span style={{ marginLeft: 8 }}>
                    <Badge>{node.handle}</Badge>
                </span>
            </div>

            {node.children?.length > 0 && open && (
                <ul style={{ marginTop: 6, paddingLeft: 0 }}>
                    {node.children.map((child) => (
                        <TreeNode key={child.id} node={child} level={level + 1} storeHandle={storeHandle} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function CollectionTree({ storeHandle = DEFAULT_STORE_HANDLE }) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetch("/api/collections-tree")
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                if (!mounted) return;
                setTree(data.tree || []);
                setTotal(data.total || (data.tree || []).length);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                if (!mounted) return;
                setError(err.message || "Failed to load");
                setLoading(false);
            });
        return () => (mounted = false);
    }, []);

    return (
        <Card sectioned>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>📂 Collection Tree</h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{loading ? "Loading…" : `${total} collections`}</span>
                </div>
            </div>

            {error && <div style={{ color: "crimson" }}>Error: {error}</div>}

            {loading && !error && <div>Loading collections…</div>}

            {!loading && !error && !tree.length && <div>No collections found.</div>}

            {!loading && !error && tree.length > 0 && (
                <ul style={{ margin: 0, padding: 0 }}>
                    {tree.map((node) => (
                        <TreeNode key={node.id} node={node} storeHandle={storeHandle} />
                    ))}
                </ul>
            )}
        </Card>
    );
}
