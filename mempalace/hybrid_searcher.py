#!/usr/bin/env python3
"""
hybrid_searcher.py — High-Fidelity Retrieval Engine for MemPalace
================================================================

This module implements a Hybrid Retrieval strategy combining Semantic Search
(Vector-based via ChromaDB) and Lexical Search (Keyword-based via SQLite FTS5).

Results are fused using the Reciprocal Rank Fusion (RRF) algorithm, which
optimizes for both conceptual relevance and exact identifier matching.

Algorithm:
    Score(d) = sum( 1 / (k + rank(d, r)) ) for r in result_sets
    where k is a smoothing constant (default 60).
"""

import logging
import sqlite3
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Optional, Any

import chromadb
from .config import MempalaceConfig

logger = logging.getLogger("mempalace.hybrid")

class HybridSearcher:
    """
    Orchestrates fused retrieval across Vector and Lexical data stores.
    """
    def __init__(self, palace_path: Optional[str] = None, kg_path: Optional[str] = None, k: int = 60):
        cfg = MempalaceConfig()
        self.palace_path = palace_path or cfg.palace_path
        self.kg_path = kg_path or Path(self.palace_path).parent / "knowledge_graph.sqlite3"
        self.k = k
        self.collection_name = cfg.collection_name
        
        # Persistent clients
        self.chroma_client = chromadb.PersistentClient(path=self.palace_path)
        try:
            self.collection = self.chroma_client.get_collection(self.collection_name)
        except Exception as e:
            logger.error(f"Failed to load Chroma collection '{self.collection_name}': {e}")
            raise

    def _fts_search(self, query: str, wing: Optional[str] = None, room: Optional[str] = None, limit: int = 50) -> List[str]:
        """
        Executes a lexical search against the SQLite FTS5 virtual table.
        Quotes the query to handle special characters (hyphens, dots) as literals.
        """
        conn = sqlite3.connect(self.kg_path)
        
        # Build query with optional wing/room scoping
        sql = "SELECT drawer_id FROM drawers_fts WHERE content MATCH ?"
        params = [f'"{query}"']
        
        if wing:
            sql += " AND wing = ?"
            params.append(wing)
        if room:
            sql += " AND room = ?"
            params.append(room)
            
        sql += " LIMIT ?"
        params.append(limit)
        
        results = []
        try:
            for row in conn.execute(sql, params).fetchall():
                results.append(row[0])
        except sqlite3.OperationalError as e:
            # Common if the FTS table hasn't been initialized or query syntax is invalid
            logger.warning(f"Lexical search failed for query '{query}': {e}")
        finally:
            conn.close()
        return results

    def _vector_search(self, query: str, wing: Optional[str] = None, room: Optional[str] = None, limit: int = 50) -> List[str]:
        """
        Executes a semantic search against ChromaDB.
        """
        where = {}
        if wing and room:
            where = {"$and": [{"wing": wing}, {"room": room}]}
        elif wing:
            where = {"wing": wing}
        elif room:
            where = {"room": room}
            
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=limit,
                where=where if where else None,
                include=["ids"]
            )
            return results["ids"][0] if results["ids"] else []
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []

    def search(self, query: str, wing: Optional[str] = None, room: Optional[str] = None, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Performs a hybrid search and returns fused, hydrated results.
        """
        # 1. Gather candidates from both engines
        vector_ids = self._vector_search(query, wing, room, limit=50)
        lexical_ids = self._fts_search(query, wing, room, limit=50)
        
        # 2. Reciprocal Rank Fusion (RRF)
        fused_scores = defaultdict(float)
        
        for rank, doc_id in enumerate(vector_ids, 1):
            fused_scores[doc_id] += 1.0 / (self.k + rank)
            
        for rank, doc_id in enumerate(lexical_ids, 1):
            fused_scores[doc_id] += 1.0 / (self.k + rank)
            
        # 3. Rank by fused score
        top_entries = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)[:n_results]
        
        if not top_entries:
            return []
            
        # 4. Hydrate from the verbatim document store
        final_ids = [item[0] for item in top_entries]
        data = self.collection.get(ids=final_ids, include=["documents", "metadatas"])
        
        doc_map = {idx: (doc, meta) for idx, doc, meta in zip(data["ids"], data["documents"], data["metadatas"])}
        
        hits = []
        for doc_id in final_ids:
            if doc_id in doc_map:
                doc, meta = doc_map[doc_id]
                hits.append({
                    "id": doc_id,
                    "text": doc,
                    "wing": meta.get("wing", "unknown"),
                    "room": meta.get("room", "unknown"),
                    "source": Path(meta.get("source_file", "?")).name,
                    "score": round(fused_scores[doc_id], 6)
                })
                
        return hits
